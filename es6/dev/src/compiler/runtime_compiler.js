var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IS_DART, isBlank } from 'angular2/src/facade/lang';
import { BaseException } from 'angular2/src/facade/exceptions';
import { ListWrapper } from 'angular2/src/facade/collection';
import { PromiseWrapper } from 'angular2/src/facade/async';
import { createHostComponentMeta, CompileIdentifierMetadata } from './compile_metadata';
import { Injectable } from 'angular2/src/core/di';
import { StyleCompiler } from './style_compiler';
import { ViewCompiler } from './view_compiler/view_compiler';
import { TemplateParser } from './template_parser';
import { DirectiveNormalizer } from './directive_normalizer';
import { CompileMetadataResolver } from './metadata_resolver';
import { ComponentFactory } from 'angular2/src/core/linker/component_factory';
import { CompilerConfig } from './config';
import * as ir from './output/output_ast';
import { jitStatements } from './output/output_jit';
import { interpretStatements } from './output/output_interpreter';
import { InterpretiveAppViewInstanceFactory } from './output/interpretive_view';
import { XHR } from 'angular2/src/compiler/xhr';
/**
 * An internal module of the Angular compiler that begins with component types,
 * extracts templates, and eventually produces a compiled version of the component
 * ready for linking into an application.
 */
export let RuntimeCompiler = class RuntimeCompiler {
    constructor(_metadataResolver, _templateNormalizer, _templateParser, _styleCompiler, _viewCompiler, _xhr, _genConfig) {
        this._metadataResolver = _metadataResolver;
        this._templateNormalizer = _templateNormalizer;
        this._templateParser = _templateParser;
        this._styleCompiler = _styleCompiler;
        this._viewCompiler = _viewCompiler;
        this._xhr = _xhr;
        this._genConfig = _genConfig;
        this._styleCache = new Map();
        this._hostCacheKeys = new Map();
        this._compiledTemplateCache = new Map();
        this._compiledTemplateDone = new Map();
    }
    resolveComponent(componentType) {
        var compMeta = this._metadataResolver.getDirectiveMetadata(componentType);
        var hostCacheKey = this._hostCacheKeys.get(componentType);
        if (isBlank(hostCacheKey)) {
            hostCacheKey = new Object();
            this._hostCacheKeys.set(componentType, hostCacheKey);
            assertComponent(compMeta);
            var hostMeta = createHostComponentMeta(compMeta.type, compMeta.selector);
            this._loadAndCompileComponent(hostCacheKey, hostMeta, [compMeta], [], []);
        }
        return this._compiledTemplateDone.get(hostCacheKey)
            .then((compiledTemplate) => new ComponentFactory(compMeta.selector, compiledTemplate.viewFactory, componentType));
    }
    clearCache() {
        this._styleCache.clear();
        this._compiledTemplateCache.clear();
        this._compiledTemplateDone.clear();
        this._hostCacheKeys.clear();
    }
    _loadAndCompileComponent(cacheKey, compMeta, viewDirectives, pipes, compilingComponentsPath) {
        var compiledTemplate = this._compiledTemplateCache.get(cacheKey);
        var done = this._compiledTemplateDone.get(cacheKey);
        if (isBlank(compiledTemplate)) {
            compiledTemplate = new CompiledTemplate();
            this._compiledTemplateCache.set(cacheKey, compiledTemplate);
            done =
                PromiseWrapper.all([this._compileComponentStyles(compMeta)].concat(viewDirectives.map(dirMeta => this._templateNormalizer.normalizeDirective(dirMeta))))
                    .then((stylesAndNormalizedViewDirMetas) => {
                    var normalizedViewDirMetas = stylesAndNormalizedViewDirMetas.slice(1);
                    var styles = stylesAndNormalizedViewDirMetas[0];
                    var parsedTemplate = this._templateParser.parse(compMeta, compMeta.template.template, normalizedViewDirMetas, pipes, compMeta.type.name);
                    var childPromises = [];
                    compiledTemplate.init(this._compileComponent(compMeta, parsedTemplate, styles, pipes, compilingComponentsPath, childPromises));
                    return PromiseWrapper.all(childPromises).then((_) => { return compiledTemplate; });
                });
            this._compiledTemplateDone.set(cacheKey, done);
        }
        return compiledTemplate;
    }
    _compileComponent(compMeta, parsedTemplate, styles, pipes, compilingComponentsPath, childPromises) {
        var compileResult = this._viewCompiler.compileComponent(compMeta, parsedTemplate, new ir.ExternalExpr(new CompileIdentifierMetadata({ runtime: styles })), pipes);
        compileResult.dependencies.forEach((dep) => {
            var childCompilingComponentsPath = ListWrapper.clone(compilingComponentsPath);
            var childCacheKey = dep.comp.type.runtime;
            var childViewDirectives = this._metadataResolver.getViewDirectivesMetadata(dep.comp.type.runtime);
            var childViewPipes = this._metadataResolver.getViewPipesMetadata(dep.comp.type.runtime);
            var childIsRecursive = ListWrapper.contains(childCompilingComponentsPath, childCacheKey);
            childCompilingComponentsPath.push(childCacheKey);
            var childComp = this._loadAndCompileComponent(dep.comp.type.runtime, dep.comp, childViewDirectives, childViewPipes, childCompilingComponentsPath);
            dep.factoryPlaceholder.runtime = childComp.proxyViewFactory;
            dep.factoryPlaceholder.name = `viewFactory_${dep.comp.type.name}`;
            if (!childIsRecursive) {
                // Only wait for a child if it is not a cycle
                childPromises.push(this._compiledTemplateDone.get(childCacheKey));
            }
        });
        var factory;
        if (IS_DART || !this._genConfig.useJit) {
            factory = interpretStatements(compileResult.statements, compileResult.viewFactoryVar, new InterpretiveAppViewInstanceFactory());
        }
        else {
            factory = jitStatements(`${compMeta.type.name}.template.js`, compileResult.statements, compileResult.viewFactoryVar);
        }
        return factory;
    }
    _compileComponentStyles(compMeta) {
        var compileResult = this._styleCompiler.compileComponent(compMeta);
        return this._resolveStylesCompileResult(compMeta.type.name, compileResult);
    }
    _resolveStylesCompileResult(sourceUrl, result) {
        var promises = result.dependencies.map((dep) => this._loadStylesheetDep(dep));
        return PromiseWrapper.all(promises)
            .then((cssTexts) => {
            var nestedCompileResultPromises = [];
            for (var i = 0; i < result.dependencies.length; i++) {
                var dep = result.dependencies[i];
                var cssText = cssTexts[i];
                var nestedCompileResult = this._styleCompiler.compileStylesheet(dep.sourceUrl, cssText, dep.isShimmed);
                nestedCompileResultPromises.push(this._resolveStylesCompileResult(dep.sourceUrl, nestedCompileResult));
            }
            return PromiseWrapper.all(nestedCompileResultPromises);
        })
            .then((nestedStylesArr) => {
            for (var i = 0; i < result.dependencies.length; i++) {
                var dep = result.dependencies[i];
                dep.valuePlaceholder.runtime = nestedStylesArr[i];
                dep.valuePlaceholder.name = `importedStyles${i}`;
            }
            if (IS_DART || !this._genConfig.useJit) {
                return interpretStatements(result.statements, result.stylesVar, new InterpretiveAppViewInstanceFactory());
            }
            else {
                return jitStatements(`${sourceUrl}.css.js`, result.statements, result.stylesVar);
            }
        });
    }
    _loadStylesheetDep(dep) {
        var cacheKey = `${dep.sourceUrl}${dep.isShimmed ? '.shim' : ''}`;
        var cssTextPromise = this._styleCache.get(cacheKey);
        if (isBlank(cssTextPromise)) {
            cssTextPromise = this._xhr.get(dep.sourceUrl);
            this._styleCache.set(cacheKey, cssTextPromise);
        }
        return cssTextPromise;
    }
};
RuntimeCompiler = __decorate([
    Injectable(), 
    __metadata('design:paramtypes', [CompileMetadataResolver, DirectiveNormalizer, TemplateParser, StyleCompiler, ViewCompiler, XHR, CompilerConfig])
], RuntimeCompiler);
class CompiledTemplate {
    constructor() {
        this.viewFactory = null;
        this.proxyViewFactory = (viewUtils, childInjector, contextEl) => this.viewFactory(viewUtils, childInjector, contextEl);
    }
    init(viewFactory) { this.viewFactory = viewFactory; }
}
function assertComponent(meta) {
    if (!meta.isComponent) {
        throw new BaseException(`Could not compile '${meta.type.name}' because it is not a component.`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVudGltZV9jb21waWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpZmZpbmdfcGx1Z2luX3dyYXBwZXItb3V0cHV0X3BhdGgtNVpCdTBmaEwudG1wL2FuZ3VsYXIyL3NyYy9jb21waWxlci9ydW50aW1lX2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztPQUFPLEVBQ0wsT0FBTyxFQUdQLE9BQU8sRUFJUixNQUFNLDBCQUEwQjtPQUMxQixFQUFDLGFBQWEsRUFBQyxNQUFNLGdDQUFnQztPQUNyRCxFQUNMLFdBQVcsRUFJWixNQUFNLGdDQUFnQztPQUNoQyxFQUFDLGNBQWMsRUFBQyxNQUFNLDJCQUEyQjtPQUNqRCxFQUNMLHVCQUF1QixFQU12Qix5QkFBeUIsRUFDMUIsTUFBTSxvQkFBb0I7T0FnQnBCLEVBQUMsVUFBVSxFQUFDLE1BQU0sc0JBQXNCO09BQ3hDLEVBQUMsYUFBYSxFQUErQyxNQUFNLGtCQUFrQjtPQUNyRixFQUFDLFlBQVksRUFBQyxNQUFNLCtCQUErQjtPQUNuRCxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQjtPQUN6QyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sd0JBQXdCO09BQ25ELEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxxQkFBcUI7T0FDcEQsRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDRDQUE0QztPQU1wRSxFQUFDLGNBQWMsRUFBQyxNQUFNLFVBQVU7T0FDaEMsS0FBSyxFQUFFLE1BQU0scUJBQXFCO09BQ2xDLEVBQUMsYUFBYSxFQUFDLE1BQU0scUJBQXFCO09BQzFDLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSw2QkFBNkI7T0FDeEQsRUFBQyxrQ0FBa0MsRUFBQyxNQUFNLDRCQUE0QjtPQUV0RSxFQUFDLEdBQUcsRUFBQyxNQUFNLDJCQUEyQjtBQUU3Qzs7OztHQUlHO0FBRUg7SUFNRSxZQUFvQixpQkFBMEMsRUFDMUMsbUJBQXdDLEVBQ3hDLGVBQStCLEVBQVUsY0FBNkIsRUFDdEUsYUFBMkIsRUFBVSxJQUFTLEVBQzlDLFVBQTBCO1FBSjFCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBeUI7UUFDMUMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtRQUN4QyxvQkFBZSxHQUFmLGVBQWUsQ0FBZ0I7UUFBVSxtQkFBYyxHQUFkLGNBQWMsQ0FBZTtRQUN0RSxrQkFBYSxHQUFiLGFBQWEsQ0FBYztRQUFVLFNBQUksR0FBSixJQUFJLENBQUs7UUFDOUMsZUFBVSxHQUFWLFVBQVUsQ0FBZ0I7UUFUdEMsZ0JBQVcsR0FBaUMsSUFBSSxHQUFHLEVBQTJCLENBQUM7UUFDL0UsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBYSxDQUFDO1FBQ3RDLDJCQUFzQixHQUFHLElBQUksR0FBRyxFQUF5QixDQUFDO1FBQzFELDBCQUFxQixHQUFHLElBQUksR0FBRyxFQUFrQyxDQUFDO0lBTXpCLENBQUM7SUFFbEQsZ0JBQWdCLENBQUMsYUFBbUI7UUFDbEMsSUFBSSxRQUFRLEdBQ1IsSUFBSSxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQy9ELElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzFELEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsWUFBWSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3JELGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMxQixJQUFJLFFBQVEsR0FDUix1QkFBdUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUU5RCxJQUFJLENBQUMsd0JBQXdCLENBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM1RSxDQUFDO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDO2FBQzlDLElBQUksQ0FBQyxDQUFDLGdCQUFrQyxLQUFLLElBQUksZ0JBQWdCLENBQ3hELFFBQVEsQ0FBQyxRQUFRLEVBQUUsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7SUFDakYsQ0FBQztJQUVELFVBQVU7UUFDUixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNwQyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDbkMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBR08sd0JBQXdCLENBQUMsUUFBYSxFQUFFLFFBQWtDLEVBQ2pELGNBQTBDLEVBQzFDLEtBQTRCLEVBQzVCLHVCQUE4QjtRQUM3RCxJQUFJLGdCQUFnQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDakUsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNwRCxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUIsZ0JBQWdCLEdBQUcsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO1lBQzFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDNUQsSUFBSTtnQkFDQSxjQUFjLENBQUMsR0FBRyxDQUNBLENBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQ25FLE9BQU8sSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUNuRixJQUFJLENBQUMsQ0FBQywrQkFBc0M7b0JBQzNDLElBQUksc0JBQXNCLEdBQUcsK0JBQStCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN0RSxJQUFJLE1BQU0sR0FBRywrQkFBK0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDaEQsSUFBSSxjQUFjLEdBQ2QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUNwQyxzQkFBc0IsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFFbEYsSUFBSSxhQUFhLEdBQUcsRUFBRSxDQUFDO29CQUN2QixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUNoQyxLQUFLLEVBQUUsdUJBQXVCLEVBQzlCLGFBQWEsQ0FBQyxDQUFDLENBQUM7b0JBQzdELE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckYsQ0FBQyxDQUFDLENBQUM7WUFDWCxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBQ0QsTUFBTSxDQUFDLGdCQUFnQixDQUFDO0lBQzFCLENBQUM7SUFFTyxpQkFBaUIsQ0FBQyxRQUFrQyxFQUFFLGNBQTZCLEVBQ2pFLE1BQWdCLEVBQUUsS0FBNEIsRUFDOUMsdUJBQThCLEVBQzlCLGFBQTZCO1FBQ3JELElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQ25ELFFBQVEsRUFBRSxjQUFjLEVBQ3hCLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLHlCQUF5QixDQUFDLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsRixhQUFhLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUc7WUFDckMsSUFBSSw0QkFBNEIsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFFOUUsSUFBSSxhQUFhLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQzFDLElBQUksbUJBQW1CLEdBQ25CLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM1RSxJQUFJLGNBQWMsR0FDZCxJQUFJLENBQUMsaUJBQWlCLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkUsSUFBSSxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ3pGLDRCQUE0QixDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUVqRCxJQUFJLFNBQVMsR0FDVCxJQUFJLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQ3BELGNBQWMsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1lBQ2hGLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLGdCQUFnQixDQUFDO1lBQzVELEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEdBQUcsZUFBZSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNsRSxFQUFFLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztnQkFDdEIsNkNBQTZDO2dCQUM3QyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUNwRSxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLE9BQU8sQ0FBQztRQUNaLEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUN2QyxPQUFPLEdBQUcsbUJBQW1CLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsY0FBYyxFQUN0RCxJQUFJLGtDQUFrQyxFQUFFLENBQUMsQ0FBQztRQUMxRSxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixPQUFPLEdBQUcsYUFBYSxDQUFDLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLGNBQWMsRUFBRSxhQUFhLENBQUMsVUFBVSxFQUM3RCxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUNELE1BQU0sQ0FBQyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVPLHVCQUF1QixDQUFDLFFBQWtDO1FBQ2hFLElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkUsTUFBTSxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQztJQUM3RSxDQUFDO0lBRU8sMkJBQTJCLENBQUMsU0FBaUIsRUFDakIsTUFBMkI7UUFDN0QsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDOUUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO2FBQzlCLElBQUksQ0FBQyxDQUFDLFFBQVE7WUFDYixJQUFJLDJCQUEyQixHQUFHLEVBQUUsQ0FBQztZQUNyQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3BELElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pDLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsSUFBSSxtQkFBbUIsR0FDbkIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2pGLDJCQUEyQixDQUFDLElBQUksQ0FDNUIsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBQzVFLENBQUM7WUFDRCxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBQ3pELENBQUMsQ0FBQzthQUNELElBQUksQ0FBQyxDQUFDLGVBQWU7WUFDcEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNwRCxJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEQsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksR0FBRyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7WUFDbkQsQ0FBQztZQUNELEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDdkMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFDbkMsSUFBSSxrQ0FBa0MsRUFBRSxDQUFDLENBQUM7WUFDdkUsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLE1BQU0sQ0FBQyxhQUFhLENBQUMsR0FBRyxTQUFTLFNBQVMsRUFBRSxNQUFNLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNuRixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDVCxDQUFDO0lBRU8sa0JBQWtCLENBQUMsR0FBNEI7UUFDckQsSUFBSSxRQUFRLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxTQUFTLEdBQUcsT0FBTyxHQUFHLEVBQUUsRUFBRSxDQUFDO1FBQ2pFLElBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BELEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsY0FBYyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUNELE1BQU0sQ0FBQyxjQUFjLENBQUM7SUFDeEIsQ0FBQztBQUNILENBQUM7QUExSkQ7SUFBQyxVQUFVLEVBQUU7O21CQUFBO0FBNEpiO0lBR0U7UUFGQSxnQkFBVyxHQUFhLElBQUksQ0FBQztRQUczQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLFNBQVMsS0FDeEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFRCxJQUFJLENBQUMsV0FBcUIsSUFBSSxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUM7QUFDakUsQ0FBQztBQUVELHlCQUF5QixJQUE4QjtJQUNyRCxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sSUFBSSxhQUFhLENBQUMsc0JBQXNCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxrQ0FBa0MsQ0FBQyxDQUFDO0lBQ2xHLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgSVNfREFSVCxcbiAgVHlwZSxcbiAgSnNvbixcbiAgaXNCbGFuayxcbiAgaXNQcmVzZW50LFxuICBzdHJpbmdpZnksXG4gIGV2YWxFeHByZXNzaW9uXG59IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvbGFuZyc7XG5pbXBvcnQge0Jhc2VFeGNlcHRpb259IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvZXhjZXB0aW9ucyc7XG5pbXBvcnQge1xuICBMaXN0V3JhcHBlcixcbiAgU2V0V3JhcHBlcixcbiAgTWFwV3JhcHBlcixcbiAgU3RyaW5nTWFwV3JhcHBlclxufSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2NvbGxlY3Rpb24nO1xuaW1wb3J0IHtQcm9taXNlV3JhcHBlcn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9hc3luYyc7XG5pbXBvcnQge1xuICBjcmVhdGVIb3N0Q29tcG9uZW50TWV0YSxcbiAgQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhLFxuICBDb21waWxlVHlwZU1ldGFkYXRhLFxuICBDb21waWxlVGVtcGxhdGVNZXRhZGF0YSxcbiAgQ29tcGlsZVBpcGVNZXRhZGF0YSxcbiAgQ29tcGlsZU1ldGFkYXRhV2l0aFR5cGUsXG4gIENvbXBpbGVJZGVudGlmaWVyTWV0YWRhdGFcbn0gZnJvbSAnLi9jb21waWxlX21ldGFkYXRhJztcbmltcG9ydCB7XG4gIFRlbXBsYXRlQXN0LFxuICBUZW1wbGF0ZUFzdFZpc2l0b3IsXG4gIE5nQ29udGVudEFzdCxcbiAgRW1iZWRkZWRUZW1wbGF0ZUFzdCxcbiAgRWxlbWVudEFzdCxcbiAgQm91bmRFdmVudEFzdCxcbiAgQm91bmRFbGVtZW50UHJvcGVydHlBc3QsXG4gIEF0dHJBc3QsXG4gIEJvdW5kVGV4dEFzdCxcbiAgVGV4dEFzdCxcbiAgRGlyZWN0aXZlQXN0LFxuICBCb3VuZERpcmVjdGl2ZVByb3BlcnR5QXN0LFxuICB0ZW1wbGF0ZVZpc2l0QWxsXG59IGZyb20gJy4vdGVtcGxhdGVfYXN0JztcbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnYW5ndWxhcjIvc3JjL2NvcmUvZGknO1xuaW1wb3J0IHtTdHlsZUNvbXBpbGVyLCBTdHlsZXNDb21waWxlRGVwZW5kZW5jeSwgU3R5bGVzQ29tcGlsZVJlc3VsdH0gZnJvbSAnLi9zdHlsZV9jb21waWxlcic7XG5pbXBvcnQge1ZpZXdDb21waWxlcn0gZnJvbSAnLi92aWV3X2NvbXBpbGVyL3ZpZXdfY29tcGlsZXInO1xuaW1wb3J0IHtUZW1wbGF0ZVBhcnNlcn0gZnJvbSAnLi90ZW1wbGF0ZV9wYXJzZXInO1xuaW1wb3J0IHtEaXJlY3RpdmVOb3JtYWxpemVyfSBmcm9tICcuL2RpcmVjdGl2ZV9ub3JtYWxpemVyJztcbmltcG9ydCB7Q29tcGlsZU1ldGFkYXRhUmVzb2x2ZXJ9IGZyb20gJy4vbWV0YWRhdGFfcmVzb2x2ZXInO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5fSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtcbiAgQ29tcG9uZW50UmVzb2x2ZXIsXG4gIFJlZmxlY3RvckNvbXBvbmVudFJlc29sdmVyXG59IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb3JlL2xpbmtlci9jb21wb25lbnRfcmVzb2x2ZXInO1xuXG5pbXBvcnQge0NvbXBpbGVyQ29uZmlnfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgKiBhcyBpciBmcm9tICcuL291dHB1dC9vdXRwdXRfYXN0JztcbmltcG9ydCB7aml0U3RhdGVtZW50c30gZnJvbSAnLi9vdXRwdXQvb3V0cHV0X2ppdCc7XG5pbXBvcnQge2ludGVycHJldFN0YXRlbWVudHN9IGZyb20gJy4vb3V0cHV0L291dHB1dF9pbnRlcnByZXRlcic7XG5pbXBvcnQge0ludGVycHJldGl2ZUFwcFZpZXdJbnN0YW5jZUZhY3Rvcnl9IGZyb20gJy4vb3V0cHV0L2ludGVycHJldGl2ZV92aWV3JztcblxuaW1wb3J0IHtYSFJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb21waWxlci94aHInO1xuXG4vKipcbiAqIEFuIGludGVybmFsIG1vZHVsZSBvZiB0aGUgQW5ndWxhciBjb21waWxlciB0aGF0IGJlZ2lucyB3aXRoIGNvbXBvbmVudCB0eXBlcyxcbiAqIGV4dHJhY3RzIHRlbXBsYXRlcywgYW5kIGV2ZW50dWFsbHkgcHJvZHVjZXMgYSBjb21waWxlZCB2ZXJzaW9uIG9mIHRoZSBjb21wb25lbnRcbiAqIHJlYWR5IGZvciBsaW5raW5nIGludG8gYW4gYXBwbGljYXRpb24uXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBSdW50aW1lQ29tcGlsZXIgaW1wbGVtZW50cyBDb21wb25lbnRSZXNvbHZlciB7XG4gIHByaXZhdGUgX3N0eWxlQ2FjaGU6IE1hcDxzdHJpbmcsIFByb21pc2U8c3RyaW5nPj4gPSBuZXcgTWFwPHN0cmluZywgUHJvbWlzZTxzdHJpbmc+PigpO1xuICBwcml2YXRlIF9ob3N0Q2FjaGVLZXlzID0gbmV3IE1hcDxUeXBlLCBhbnk+KCk7XG4gIHByaXZhdGUgX2NvbXBpbGVkVGVtcGxhdGVDYWNoZSA9IG5ldyBNYXA8YW55LCBDb21waWxlZFRlbXBsYXRlPigpO1xuICBwcml2YXRlIF9jb21waWxlZFRlbXBsYXRlRG9uZSA9IG5ldyBNYXA8YW55LCBQcm9taXNlPENvbXBpbGVkVGVtcGxhdGU+PigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX21ldGFkYXRhUmVzb2x2ZXI6IENvbXBpbGVNZXRhZGF0YVJlc29sdmVyLFxuICAgICAgICAgICAgICBwcml2YXRlIF90ZW1wbGF0ZU5vcm1hbGl6ZXI6IERpcmVjdGl2ZU5vcm1hbGl6ZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgX3RlbXBsYXRlUGFyc2VyOiBUZW1wbGF0ZVBhcnNlciwgcHJpdmF0ZSBfc3R5bGVDb21waWxlcjogU3R5bGVDb21waWxlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfdmlld0NvbXBpbGVyOiBWaWV3Q29tcGlsZXIsIHByaXZhdGUgX3hocjogWEhSLFxuICAgICAgICAgICAgICBwcml2YXRlIF9nZW5Db25maWc6IENvbXBpbGVyQ29uZmlnKSB7fVxuXG4gIHJlc29sdmVDb21wb25lbnQoY29tcG9uZW50VHlwZTogVHlwZSk6IFByb21pc2U8Q29tcG9uZW50RmFjdG9yeTxhbnk+PiB7XG4gICAgdmFyIGNvbXBNZXRhOiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEgPVxuICAgICAgICB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmdldERpcmVjdGl2ZU1ldGFkYXRhKGNvbXBvbmVudFR5cGUpO1xuICAgIHZhciBob3N0Q2FjaGVLZXkgPSB0aGlzLl9ob3N0Q2FjaGVLZXlzLmdldChjb21wb25lbnRUeXBlKTtcbiAgICBpZiAoaXNCbGFuayhob3N0Q2FjaGVLZXkpKSB7XG4gICAgICBob3N0Q2FjaGVLZXkgPSBuZXcgT2JqZWN0KCk7XG4gICAgICB0aGlzLl9ob3N0Q2FjaGVLZXlzLnNldChjb21wb25lbnRUeXBlLCBob3N0Q2FjaGVLZXkpO1xuICAgICAgYXNzZXJ0Q29tcG9uZW50KGNvbXBNZXRhKTtcbiAgICAgIHZhciBob3N0TWV0YTogQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhID1cbiAgICAgICAgICBjcmVhdGVIb3N0Q29tcG9uZW50TWV0YShjb21wTWV0YS50eXBlLCBjb21wTWV0YS5zZWxlY3Rvcik7XG5cbiAgICAgIHRoaXMuX2xvYWRBbmRDb21waWxlQ29tcG9uZW50KGhvc3RDYWNoZUtleSwgaG9zdE1ldGEsIFtjb21wTWV0YV0sIFtdLCBbXSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9jb21waWxlZFRlbXBsYXRlRG9uZS5nZXQoaG9zdENhY2hlS2V5KVxuICAgICAgICAudGhlbigoY29tcGlsZWRUZW1wbGF0ZTogQ29tcGlsZWRUZW1wbGF0ZSkgPT4gbmV3IENvbXBvbmVudEZhY3RvcnkoXG4gICAgICAgICAgICAgICAgICBjb21wTWV0YS5zZWxlY3RvciwgY29tcGlsZWRUZW1wbGF0ZS52aWV3RmFjdG9yeSwgY29tcG9uZW50VHlwZSkpO1xuICB9XG5cbiAgY2xlYXJDYWNoZSgpIHtcbiAgICB0aGlzLl9zdHlsZUNhY2hlLmNsZWFyKCk7XG4gICAgdGhpcy5fY29tcGlsZWRUZW1wbGF0ZUNhY2hlLmNsZWFyKCk7XG4gICAgdGhpcy5fY29tcGlsZWRUZW1wbGF0ZURvbmUuY2xlYXIoKTtcbiAgICB0aGlzLl9ob3N0Q2FjaGVLZXlzLmNsZWFyKCk7XG4gIH1cblxuXG4gIHByaXZhdGUgX2xvYWRBbmRDb21waWxlQ29tcG9uZW50KGNhY2hlS2V5OiBhbnksIGNvbXBNZXRhOiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdEaXJlY3RpdmVzOiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGFbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGlwZXM6IENvbXBpbGVQaXBlTWV0YWRhdGFbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcGlsaW5nQ29tcG9uZW50c1BhdGg6IGFueVtdKTogQ29tcGlsZWRUZW1wbGF0ZSB7XG4gICAgdmFyIGNvbXBpbGVkVGVtcGxhdGUgPSB0aGlzLl9jb21waWxlZFRlbXBsYXRlQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICB2YXIgZG9uZSA9IHRoaXMuX2NvbXBpbGVkVGVtcGxhdGVEb25lLmdldChjYWNoZUtleSk7XG4gICAgaWYgKGlzQmxhbmsoY29tcGlsZWRUZW1wbGF0ZSkpIHtcbiAgICAgIGNvbXBpbGVkVGVtcGxhdGUgPSBuZXcgQ29tcGlsZWRUZW1wbGF0ZSgpO1xuICAgICAgdGhpcy5fY29tcGlsZWRUZW1wbGF0ZUNhY2hlLnNldChjYWNoZUtleSwgY29tcGlsZWRUZW1wbGF0ZSk7XG4gICAgICBkb25lID1cbiAgICAgICAgICBQcm9taXNlV3JhcHBlci5hbGwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgWzxhbnk+dGhpcy5fY29tcGlsZUNvbXBvbmVudFN0eWxlcyhjb21wTWV0YSldLmNvbmNhdCh2aWV3RGlyZWN0aXZlcy5tYXAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpck1ldGEgPT4gdGhpcy5fdGVtcGxhdGVOb3JtYWxpemVyLm5vcm1hbGl6ZURpcmVjdGl2ZShkaXJNZXRhKSkpKVxuICAgICAgICAgICAgICAudGhlbigoc3R5bGVzQW5kTm9ybWFsaXplZFZpZXdEaXJNZXRhczogYW55W10pID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgbm9ybWFsaXplZFZpZXdEaXJNZXRhcyA9IHN0eWxlc0FuZE5vcm1hbGl6ZWRWaWV3RGlyTWV0YXMuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgdmFyIHN0eWxlcyA9IHN0eWxlc0FuZE5vcm1hbGl6ZWRWaWV3RGlyTWV0YXNbMF07XG4gICAgICAgICAgICAgICAgdmFyIHBhcnNlZFRlbXBsYXRlID1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdGVtcGxhdGVQYXJzZXIucGFyc2UoY29tcE1ldGEsIGNvbXBNZXRhLnRlbXBsYXRlLnRlbXBsYXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkVmlld0Rpck1ldGFzLCBwaXBlcywgY29tcE1ldGEudHlwZS5uYW1lKTtcblxuICAgICAgICAgICAgICAgIHZhciBjaGlsZFByb21pc2VzID0gW107XG4gICAgICAgICAgICAgICAgY29tcGlsZWRUZW1wbGF0ZS5pbml0KHRoaXMuX2NvbXBpbGVDb21wb25lbnQoY29tcE1ldGEsIHBhcnNlZFRlbXBsYXRlLCBzdHlsZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGlwZXMsIGNvbXBpbGluZ0NvbXBvbmVudHNQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkUHJvbWlzZXMpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZVdyYXBwZXIuYWxsKGNoaWxkUHJvbWlzZXMpLnRoZW4oKF8pID0+IHsgcmV0dXJuIGNvbXBpbGVkVGVtcGxhdGU7IH0pO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgIHRoaXMuX2NvbXBpbGVkVGVtcGxhdGVEb25lLnNldChjYWNoZUtleSwgZG9uZSk7XG4gICAgfVxuICAgIHJldHVybiBjb21waWxlZFRlbXBsYXRlO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29tcGlsZUNvbXBvbmVudChjb21wTWV0YTogQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhLCBwYXJzZWRUZW1wbGF0ZTogVGVtcGxhdGVBc3RbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZXM6IHN0cmluZ1tdLCBwaXBlczogQ29tcGlsZVBpcGVNZXRhZGF0YVtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBpbGluZ0NvbXBvbmVudHNQYXRoOiBhbnlbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZFByb21pc2VzOiBQcm9taXNlPGFueT5bXSk6IEZ1bmN0aW9uIHtcbiAgICB2YXIgY29tcGlsZVJlc3VsdCA9IHRoaXMuX3ZpZXdDb21waWxlci5jb21waWxlQ29tcG9uZW50KFxuICAgICAgICBjb21wTWV0YSwgcGFyc2VkVGVtcGxhdGUsXG4gICAgICAgIG5ldyBpci5FeHRlcm5hbEV4cHIobmV3IENvbXBpbGVJZGVudGlmaWVyTWV0YWRhdGEoe3J1bnRpbWU6IHN0eWxlc30pKSwgcGlwZXMpO1xuICAgIGNvbXBpbGVSZXN1bHQuZGVwZW5kZW5jaWVzLmZvckVhY2goKGRlcCkgPT4ge1xuICAgICAgdmFyIGNoaWxkQ29tcGlsaW5nQ29tcG9uZW50c1BhdGggPSBMaXN0V3JhcHBlci5jbG9uZShjb21waWxpbmdDb21wb25lbnRzUGF0aCk7XG5cbiAgICAgIHZhciBjaGlsZENhY2hlS2V5ID0gZGVwLmNvbXAudHlwZS5ydW50aW1lO1xuICAgICAgdmFyIGNoaWxkVmlld0RpcmVjdGl2ZXM6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YVtdID1cbiAgICAgICAgICB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmdldFZpZXdEaXJlY3RpdmVzTWV0YWRhdGEoZGVwLmNvbXAudHlwZS5ydW50aW1lKTtcbiAgICAgIHZhciBjaGlsZFZpZXdQaXBlczogQ29tcGlsZVBpcGVNZXRhZGF0YVtdID1cbiAgICAgICAgICB0aGlzLl9tZXRhZGF0YVJlc29sdmVyLmdldFZpZXdQaXBlc01ldGFkYXRhKGRlcC5jb21wLnR5cGUucnVudGltZSk7XG4gICAgICB2YXIgY2hpbGRJc1JlY3Vyc2l2ZSA9IExpc3RXcmFwcGVyLmNvbnRhaW5zKGNoaWxkQ29tcGlsaW5nQ29tcG9uZW50c1BhdGgsIGNoaWxkQ2FjaGVLZXkpO1xuICAgICAgY2hpbGRDb21waWxpbmdDb21wb25lbnRzUGF0aC5wdXNoKGNoaWxkQ2FjaGVLZXkpO1xuXG4gICAgICB2YXIgY2hpbGRDb21wID1cbiAgICAgICAgICB0aGlzLl9sb2FkQW5kQ29tcGlsZUNvbXBvbmVudChkZXAuY29tcC50eXBlLnJ1bnRpbWUsIGRlcC5jb21wLCBjaGlsZFZpZXdEaXJlY3RpdmVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkVmlld1BpcGVzLCBjaGlsZENvbXBpbGluZ0NvbXBvbmVudHNQYXRoKTtcbiAgICAgIGRlcC5mYWN0b3J5UGxhY2Vob2xkZXIucnVudGltZSA9IGNoaWxkQ29tcC5wcm94eVZpZXdGYWN0b3J5O1xuICAgICAgZGVwLmZhY3RvcnlQbGFjZWhvbGRlci5uYW1lID0gYHZpZXdGYWN0b3J5XyR7ZGVwLmNvbXAudHlwZS5uYW1lfWA7XG4gICAgICBpZiAoIWNoaWxkSXNSZWN1cnNpdmUpIHtcbiAgICAgICAgLy8gT25seSB3YWl0IGZvciBhIGNoaWxkIGlmIGl0IGlzIG5vdCBhIGN5Y2xlXG4gICAgICAgIGNoaWxkUHJvbWlzZXMucHVzaCh0aGlzLl9jb21waWxlZFRlbXBsYXRlRG9uZS5nZXQoY2hpbGRDYWNoZUtleSkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHZhciBmYWN0b3J5O1xuICAgIGlmIChJU19EQVJUIHx8ICF0aGlzLl9nZW5Db25maWcudXNlSml0KSB7XG4gICAgICBmYWN0b3J5ID0gaW50ZXJwcmV0U3RhdGVtZW50cyhjb21waWxlUmVzdWx0LnN0YXRlbWVudHMsIGNvbXBpbGVSZXN1bHQudmlld0ZhY3RvcnlWYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgSW50ZXJwcmV0aXZlQXBwVmlld0luc3RhbmNlRmFjdG9yeSgpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmFjdG9yeSA9IGppdFN0YXRlbWVudHMoYCR7Y29tcE1ldGEudHlwZS5uYW1lfS50ZW1wbGF0ZS5qc2AsIGNvbXBpbGVSZXN1bHQuc3RhdGVtZW50cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBpbGVSZXN1bHQudmlld0ZhY3RvcnlWYXIpO1xuICAgIH1cbiAgICByZXR1cm4gZmFjdG9yeTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbXBpbGVDb21wb25lbnRTdHlsZXMoY29tcE1ldGE6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB2YXIgY29tcGlsZVJlc3VsdCA9IHRoaXMuX3N0eWxlQ29tcGlsZXIuY29tcGlsZUNvbXBvbmVudChjb21wTWV0YSk7XG4gICAgcmV0dXJuIHRoaXMuX3Jlc29sdmVTdHlsZXNDb21waWxlUmVzdWx0KGNvbXBNZXRhLnR5cGUubmFtZSwgY29tcGlsZVJlc3VsdCk7XG4gIH1cblxuICBwcml2YXRlIF9yZXNvbHZlU3R5bGVzQ29tcGlsZVJlc3VsdChzb3VyY2VVcmw6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBTdHlsZXNDb21waWxlUmVzdWx0KTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHZhciBwcm9taXNlcyA9IHJlc3VsdC5kZXBlbmRlbmNpZXMubWFwKChkZXApID0+IHRoaXMuX2xvYWRTdHlsZXNoZWV0RGVwKGRlcCkpO1xuICAgIHJldHVybiBQcm9taXNlV3JhcHBlci5hbGwocHJvbWlzZXMpXG4gICAgICAgIC50aGVuKChjc3NUZXh0cykgPT4ge1xuICAgICAgICAgIHZhciBuZXN0ZWRDb21waWxlUmVzdWx0UHJvbWlzZXMgPSBbXTtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdC5kZXBlbmRlbmNpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBkZXAgPSByZXN1bHQuZGVwZW5kZW5jaWVzW2ldO1xuICAgICAgICAgICAgdmFyIGNzc1RleHQgPSBjc3NUZXh0c1tpXTtcbiAgICAgICAgICAgIHZhciBuZXN0ZWRDb21waWxlUmVzdWx0ID1cbiAgICAgICAgICAgICAgICB0aGlzLl9zdHlsZUNvbXBpbGVyLmNvbXBpbGVTdHlsZXNoZWV0KGRlcC5zb3VyY2VVcmwsIGNzc1RleHQsIGRlcC5pc1NoaW1tZWQpO1xuICAgICAgICAgICAgbmVzdGVkQ29tcGlsZVJlc3VsdFByb21pc2VzLnB1c2goXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZVN0eWxlc0NvbXBpbGVSZXN1bHQoZGVwLnNvdXJjZVVybCwgbmVzdGVkQ29tcGlsZVJlc3VsdCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gUHJvbWlzZVdyYXBwZXIuYWxsKG5lc3RlZENvbXBpbGVSZXN1bHRQcm9taXNlcyk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChuZXN0ZWRTdHlsZXNBcnIpID0+IHtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdC5kZXBlbmRlbmNpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBkZXAgPSByZXN1bHQuZGVwZW5kZW5jaWVzW2ldO1xuICAgICAgICAgICAgZGVwLnZhbHVlUGxhY2Vob2xkZXIucnVudGltZSA9IG5lc3RlZFN0eWxlc0FycltpXTtcbiAgICAgICAgICAgIGRlcC52YWx1ZVBsYWNlaG9sZGVyLm5hbWUgPSBgaW1wb3J0ZWRTdHlsZXMke2l9YDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKElTX0RBUlQgfHwgIXRoaXMuX2dlbkNvbmZpZy51c2VKaXQpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnRlcnByZXRTdGF0ZW1lbnRzKHJlc3VsdC5zdGF0ZW1lbnRzLCByZXN1bHQuc3R5bGVzVmFyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEludGVycHJldGl2ZUFwcFZpZXdJbnN0YW5jZUZhY3RvcnkoKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBqaXRTdGF0ZW1lbnRzKGAke3NvdXJjZVVybH0uY3NzLmpzYCwgcmVzdWx0LnN0YXRlbWVudHMsIHJlc3VsdC5zdHlsZXNWYXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9sb2FkU3R5bGVzaGVldERlcChkZXA6IFN0eWxlc0NvbXBpbGVEZXBlbmRlbmN5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB2YXIgY2FjaGVLZXkgPSBgJHtkZXAuc291cmNlVXJsfSR7ZGVwLmlzU2hpbW1lZCA/ICcuc2hpbScgOiAnJ31gO1xuICAgIHZhciBjc3NUZXh0UHJvbWlzZSA9IHRoaXMuX3N0eWxlQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICBpZiAoaXNCbGFuayhjc3NUZXh0UHJvbWlzZSkpIHtcbiAgICAgIGNzc1RleHRQcm9taXNlID0gdGhpcy5feGhyLmdldChkZXAuc291cmNlVXJsKTtcbiAgICAgIHRoaXMuX3N0eWxlQ2FjaGUuc2V0KGNhY2hlS2V5LCBjc3NUZXh0UHJvbWlzZSk7XG4gICAgfVxuICAgIHJldHVybiBjc3NUZXh0UHJvbWlzZTtcbiAgfVxufVxuXG5jbGFzcyBDb21waWxlZFRlbXBsYXRlIHtcbiAgdmlld0ZhY3Rvcnk6IEZ1bmN0aW9uID0gbnVsbDtcbiAgcHJveHlWaWV3RmFjdG9yeTogRnVuY3Rpb247XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMucHJveHlWaWV3RmFjdG9yeSA9ICh2aWV3VXRpbHMsIGNoaWxkSW5qZWN0b3IsIGNvbnRleHRFbCkgPT5cbiAgICAgICAgdGhpcy52aWV3RmFjdG9yeSh2aWV3VXRpbHMsIGNoaWxkSW5qZWN0b3IsIGNvbnRleHRFbCk7XG4gIH1cblxuICBpbml0KHZpZXdGYWN0b3J5OiBGdW5jdGlvbikgeyB0aGlzLnZpZXdGYWN0b3J5ID0gdmlld0ZhY3Rvcnk7IH1cbn1cblxuZnVuY3Rpb24gYXNzZXJ0Q29tcG9uZW50KG1ldGE6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSkge1xuICBpZiAoIW1ldGEuaXNDb21wb25lbnQpIHtcbiAgICB0aHJvdyBuZXcgQmFzZUV4Y2VwdGlvbihgQ291bGQgbm90IGNvbXBpbGUgJyR7bWV0YS50eXBlLm5hbWV9JyBiZWNhdXNlIGl0IGlzIG5vdCBhIGNvbXBvbmVudC5gKTtcbiAgfVxufVxuIl19
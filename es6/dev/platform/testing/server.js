import { APP_ID, NgZone, PLATFORM_COMMON_PROVIDERS, PLATFORM_INITIALIZER, APPLICATION_COMMON_PROVIDERS } from 'angular2/core';
import { DirectiveResolver, ViewResolver } from 'angular2/compiler';
import { Parse5DomAdapter } from 'angular2/src/platform/server/parse5_adapter';
import { AnimationBuilder } from 'angular2/src/animate/animation_builder';
import { MockAnimationBuilder } from 'angular2/src/mock/animation_builder_mock';
import { MockDirectiveResolver } from 'angular2/src/mock/directive_resolver_mock';
import { MockViewResolver } from 'angular2/src/mock/view_resolver_mock';
import { MockLocationStrategy } from 'angular2/src/mock/mock_location_strategy';
import { createNgZone } from 'angular2/src/core/application_ref';
import { TestComponentBuilder } from 'angular2/src/testing/test_component_builder';
import { XHR } from 'angular2/src/compiler/xhr';
import { BrowserDetection } from 'angular2/src/testing/utils';
import { COMPILER_PROVIDERS } from 'angular2/src/compiler/compiler';
import { DOCUMENT } from 'angular2/src/platform/dom/dom_tokens';
import { DOM } from 'angular2/src/platform/dom/dom_adapter';
import { RootRenderer } from 'angular2/src/core/render/api';
import { DomRootRenderer, DomRootRenderer_ } from 'angular2/src/platform/dom/dom_renderer';
import { DomSharedStylesHost, SharedStylesHost } from 'angular2/src/platform/dom/shared_styles_host';
import { EventManager, EVENT_MANAGER_PLUGINS, ELEMENT_PROBE_PROVIDERS } from 'angular2/platform/common_dom';
import { DomEventsPlugin } from 'angular2/src/platform/dom/events/dom_events';
import { LocationStrategy } from 'angular2/platform/common';
import { Log } from 'angular2/src/testing/utils';
function initServerTests() {
    Parse5DomAdapter.makeCurrent();
    BrowserDetection.setup();
}
/**
 * Default platform providers for testing.
 */
export const TEST_SERVER_PLATFORM_PROVIDERS = 
/*@ts2dart_const*/ [
    PLATFORM_COMMON_PROVIDERS,
    /*@ts2dart_Provider*/ { provide: PLATFORM_INITIALIZER, useValue: initServerTests, multi: true }
];
function appDoc() {
    try {
        return DOM.defaultDoc();
    }
    catch (e) {
        return null;
    }
}
/**
 * Default application providers for testing.
 */
export const TEST_SERVER_APPLICATION_PROVIDERS = 
/*@ts2dart_const*/ [
    // TODO(julie: when angular2/platform/server is available, use that instead of making our own
    // list here.
    APPLICATION_COMMON_PROVIDERS,
    COMPILER_PROVIDERS,
    /* @ts2dart_Provider */ { provide: DOCUMENT, useFactory: appDoc },
    /* @ts2dart_Provider */ { provide: DomRootRenderer, useClass: DomRootRenderer_ },
    /* @ts2dart_Provider */ { provide: RootRenderer, useExisting: DomRootRenderer },
    EventManager,
    /* @ts2dart_Provider */ { provide: EVENT_MANAGER_PLUGINS, useClass: DomEventsPlugin, multi: true },
    /* @ts2dart_Provider */ { provide: XHR, useClass: XHR },
    /* @ts2dart_Provider */ { provide: APP_ID, useValue: 'a' },
    /* @ts2dart_Provider */ { provide: SharedStylesHost, useExisting: DomSharedStylesHost },
    DomSharedStylesHost,
    ELEMENT_PROBE_PROVIDERS,
    /* @ts2dart_Provider */ { provide: DirectiveResolver, useClass: MockDirectiveResolver },
    /* @ts2dart_Provider */ { provide: ViewResolver, useClass: MockViewResolver },
    Log,
    TestComponentBuilder,
    /* @ts2dart_Provider */ { provide: NgZone, useFactory: createNgZone },
    /* @ts2dart_Provider */ { provide: LocationStrategy, useClass: MockLocationStrategy },
    /* @ts2dart_Provider */ { provide: AnimationBuilder, useClass: MockAnimationBuilder },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGlmZmluZ19wbHVnaW5fd3JhcHBlci1vdXRwdXRfcGF0aC01WkJ1MGZoTC50bXAvYW5ndWxhcjIvcGxhdGZvcm0vdGVzdGluZy9zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ik9BQU8sRUFDTCxNQUFNLEVBQ04sTUFBTSxFQUNOLHlCQUF5QixFQUN6QixvQkFBb0IsRUFDcEIsNEJBQTRCLEVBRTdCLE1BQU0sZUFBZTtPQUNmLEVBQUMsaUJBQWlCLEVBQUUsWUFBWSxFQUFDLE1BQU0sbUJBQW1CO09BRTFELEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw2Q0FBNkM7T0FFckUsRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHdDQUF3QztPQUNoRSxFQUFDLG9CQUFvQixFQUFDLE1BQU0sMENBQTBDO09BQ3RFLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQ0FBMkM7T0FDeEUsRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHNDQUFzQztPQUM5RCxFQUFDLG9CQUFvQixFQUFDLE1BQU0sMENBQTBDO09BR3RFLEVBQUMsWUFBWSxFQUFDLE1BQU0sbUNBQW1DO09BQ3ZELEVBQUMsb0JBQW9CLEVBQUMsTUFBTSw2Q0FBNkM7T0FDekUsRUFBQyxHQUFHLEVBQUMsTUFBTSwyQkFBMkI7T0FDdEMsRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDRCQUE0QjtPQUVwRCxFQUFDLGtCQUFrQixFQUFDLE1BQU0sZ0NBQWdDO09BQzFELEVBQUMsUUFBUSxFQUFDLE1BQU0sc0NBQXNDO09BQ3RELEVBQUMsR0FBRyxFQUFDLE1BQU0sdUNBQXVDO09BQ2xELEVBQUMsWUFBWSxFQUFDLE1BQU0sOEJBQThCO09BQ2xELEVBQUMsZUFBZSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sd0NBQXdDO09BQ2pGLEVBQUMsbUJBQW1CLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSw4Q0FBOEM7T0FFM0YsRUFDTCxZQUFZLEVBQ1oscUJBQXFCLEVBQ3JCLHVCQUF1QixFQUN4QixNQUFNLDhCQUE4QjtPQUM5QixFQUFDLGVBQWUsRUFBQyxNQUFNLDZDQUE2QztPQUNwRSxFQUFDLGdCQUFnQixFQUFDLE1BQU0sMEJBQTBCO09BR2xELEVBQUMsR0FBRyxFQUFDLE1BQU0sNEJBQTRCO0FBRTlDO0lBQ0UsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDL0IsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDM0IsQ0FBQztBQUVEOztHQUVHO0FBQ0gsT0FBTyxNQUFNLDhCQUE4QjtBQUN2QyxrQkFBa0IsQ0FBQTtJQUNoQix5QkFBeUI7SUFDekIscUJBQXFCLENBQUMsRUFBQyxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFDO0NBQzlGLENBQUM7QUFFTjtJQUNFLElBQUksQ0FBQztRQUNILE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDMUIsQ0FBRTtJQUFBLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDWCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILE9BQU8sTUFBTSxpQ0FBaUM7QUFDMUMsa0JBQWtCLENBQUE7SUFDaEIsNkZBQTZGO0lBQzdGLGFBQWE7SUFDYiw0QkFBNEI7SUFDNUIsa0JBQWtCO0lBQ2xCLHVCQUF1QixDQUFDLEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFDO0lBQy9ELHVCQUF1QixDQUFDLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUM7SUFDOUUsdUJBQXVCLENBQUMsRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxlQUFlLEVBQUM7SUFDN0UsWUFBWTtJQUNaLHVCQUF1QixDQUFDLEVBQUMsT0FBTyxFQUFFLHFCQUFxQixFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBQztJQUNoRyx1QkFBdUIsQ0FBQyxFQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBQztJQUNyRCx1QkFBdUIsQ0FBQyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBQztJQUN4RCx1QkFBdUIsQ0FBQyxFQUFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUM7SUFDckYsbUJBQW1CO0lBQ25CLHVCQUF1QjtJQUN2Qix1QkFBdUIsQ0FBQyxFQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxRQUFRLEVBQUUscUJBQXFCLEVBQUM7SUFDckYsdUJBQXVCLENBQUMsRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBQztJQUMzRSxHQUFHO0lBQ0gsb0JBQW9CO0lBQ3BCLHVCQUF1QixDQUFDLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFDO0lBQ25FLHVCQUF1QixDQUFDLEVBQUMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxvQkFBb0IsRUFBQztJQUNuRix1QkFBdUIsQ0FBQyxFQUFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsb0JBQW9CLEVBQUM7Q0FDcEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEFQUF9JRCxcbiAgTmdab25lLFxuICBQTEFURk9STV9DT01NT05fUFJPVklERVJTLFxuICBQTEFURk9STV9JTklUSUFMSVpFUixcbiAgQVBQTElDQVRJT05fQ09NTU9OX1BST1ZJREVSUyxcbiAgUmVuZGVyZXJcbn0gZnJvbSAnYW5ndWxhcjIvY29yZSc7XG5pbXBvcnQge0RpcmVjdGl2ZVJlc29sdmVyLCBWaWV3UmVzb2x2ZXJ9IGZyb20gJ2FuZ3VsYXIyL2NvbXBpbGVyJztcblxuaW1wb3J0IHtQYXJzZTVEb21BZGFwdGVyfSBmcm9tICdhbmd1bGFyMi9zcmMvcGxhdGZvcm0vc2VydmVyL3BhcnNlNV9hZGFwdGVyJztcblxuaW1wb3J0IHtBbmltYXRpb25CdWlsZGVyfSBmcm9tICdhbmd1bGFyMi9zcmMvYW5pbWF0ZS9hbmltYXRpb25fYnVpbGRlcic7XG5pbXBvcnQge01vY2tBbmltYXRpb25CdWlsZGVyfSBmcm9tICdhbmd1bGFyMi9zcmMvbW9jay9hbmltYXRpb25fYnVpbGRlcl9tb2NrJztcbmltcG9ydCB7TW9ja0RpcmVjdGl2ZVJlc29sdmVyfSBmcm9tICdhbmd1bGFyMi9zcmMvbW9jay9kaXJlY3RpdmVfcmVzb2x2ZXJfbW9jayc7XG5pbXBvcnQge01vY2tWaWV3UmVzb2x2ZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9tb2NrL3ZpZXdfcmVzb2x2ZXJfbW9jayc7XG5pbXBvcnQge01vY2tMb2NhdGlvblN0cmF0ZWd5fSBmcm9tICdhbmd1bGFyMi9zcmMvbW9jay9tb2NrX2xvY2F0aW9uX3N0cmF0ZWd5JztcbmltcG9ydCB7TW9ja05nWm9uZX0gZnJvbSAnYW5ndWxhcjIvc3JjL21vY2svbmdfem9uZV9tb2NrJztcblxuaW1wb3J0IHtjcmVhdGVOZ1pvbmV9IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb3JlL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge1Rlc3RDb21wb25lbnRCdWlsZGVyfSBmcm9tICdhbmd1bGFyMi9zcmMvdGVzdGluZy90ZXN0X2NvbXBvbmVudF9idWlsZGVyJztcbmltcG9ydCB7WEhSfSBmcm9tICdhbmd1bGFyMi9zcmMvY29tcGlsZXIveGhyJztcbmltcG9ydCB7QnJvd3NlckRldGVjdGlvbn0gZnJvbSAnYW5ndWxhcjIvc3JjL3Rlc3RpbmcvdXRpbHMnO1xuXG5pbXBvcnQge0NPTVBJTEVSX1BST1ZJREVSU30gZnJvbSAnYW5ndWxhcjIvc3JjL2NvbXBpbGVyL2NvbXBpbGVyJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ2FuZ3VsYXIyL3NyYy9wbGF0Zm9ybS9kb20vZG9tX3Rva2Vucyc7XG5pbXBvcnQge0RPTX0gZnJvbSAnYW5ndWxhcjIvc3JjL3BsYXRmb3JtL2RvbS9kb21fYWRhcHRlcic7XG5pbXBvcnQge1Jvb3RSZW5kZXJlcn0gZnJvbSAnYW5ndWxhcjIvc3JjL2NvcmUvcmVuZGVyL2FwaSc7XG5pbXBvcnQge0RvbVJvb3RSZW5kZXJlciwgRG9tUm9vdFJlbmRlcmVyX30gZnJvbSAnYW5ndWxhcjIvc3JjL3BsYXRmb3JtL2RvbS9kb21fcmVuZGVyZXInO1xuaW1wb3J0IHtEb21TaGFyZWRTdHlsZXNIb3N0LCBTaGFyZWRTdHlsZXNIb3N0fSBmcm9tICdhbmd1bGFyMi9zcmMvcGxhdGZvcm0vZG9tL3NoYXJlZF9zdHlsZXNfaG9zdCc7XG5cbmltcG9ydCB7XG4gIEV2ZW50TWFuYWdlcixcbiAgRVZFTlRfTUFOQUdFUl9QTFVHSU5TLFxuICBFTEVNRU5UX1BST0JFX1BST1ZJREVSU1xufSBmcm9tICdhbmd1bGFyMi9wbGF0Zm9ybS9jb21tb25fZG9tJztcbmltcG9ydCB7RG9tRXZlbnRzUGx1Z2lufSBmcm9tICdhbmd1bGFyMi9zcmMvcGxhdGZvcm0vZG9tL2V2ZW50cy9kb21fZXZlbnRzJztcbmltcG9ydCB7TG9jYXRpb25TdHJhdGVneX0gZnJvbSAnYW5ndWxhcjIvcGxhdGZvcm0vY29tbW9uJztcblxuXG5pbXBvcnQge0xvZ30gZnJvbSAnYW5ndWxhcjIvc3JjL3Rlc3RpbmcvdXRpbHMnO1xuXG5mdW5jdGlvbiBpbml0U2VydmVyVGVzdHMoKSB7XG4gIFBhcnNlNURvbUFkYXB0ZXIubWFrZUN1cnJlbnQoKTtcbiAgQnJvd3NlckRldGVjdGlvbi5zZXR1cCgpO1xufVxuXG4vKipcbiAqIERlZmF1bHQgcGxhdGZvcm0gcHJvdmlkZXJzIGZvciB0ZXN0aW5nLlxuICovXG5leHBvcnQgY29uc3QgVEVTVF9TRVJWRVJfUExBVEZPUk1fUFJPVklERVJTOiBBcnJheTxhbnkgLypUeXBlIHwgUHJvdmlkZXIgfCBhbnlbXSovPiA9XG4gICAgLypAdHMyZGFydF9jb25zdCovW1xuICAgICAgUExBVEZPUk1fQ09NTU9OX1BST1ZJREVSUyxcbiAgICAgIC8qQHRzMmRhcnRfUHJvdmlkZXIqLyB7cHJvdmlkZTogUExBVEZPUk1fSU5JVElBTElaRVIsIHVzZVZhbHVlOiBpbml0U2VydmVyVGVzdHMsIG11bHRpOiB0cnVlfVxuICAgIF07XG5cbmZ1bmN0aW9uIGFwcERvYygpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gRE9NLmRlZmF1bHREb2MoKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogRGVmYXVsdCBhcHBsaWNhdGlvbiBwcm92aWRlcnMgZm9yIHRlc3RpbmcuXG4gKi9cbmV4cG9ydCBjb25zdCBURVNUX1NFUlZFUl9BUFBMSUNBVElPTl9QUk9WSURFUlM6IEFycmF5PGFueSAvKlR5cGUgfCBQcm92aWRlciB8IGFueVtdKi8+ID1cbiAgICAvKkB0czJkYXJ0X2NvbnN0Ki9bXG4gICAgICAvLyBUT0RPKGp1bGllOiB3aGVuIGFuZ3VsYXIyL3BsYXRmb3JtL3NlcnZlciBpcyBhdmFpbGFibGUsIHVzZSB0aGF0IGluc3RlYWQgb2YgbWFraW5nIG91ciBvd25cbiAgICAgIC8vIGxpc3QgaGVyZS5cbiAgICAgIEFQUExJQ0FUSU9OX0NPTU1PTl9QUk9WSURFUlMsXG4gICAgICBDT01QSUxFUl9QUk9WSURFUlMsXG4gICAgICAvKiBAdHMyZGFydF9Qcm92aWRlciAqLyB7cHJvdmlkZTogRE9DVU1FTlQsIHVzZUZhY3Rvcnk6IGFwcERvY30sXG4gICAgICAvKiBAdHMyZGFydF9Qcm92aWRlciAqLyB7cHJvdmlkZTogRG9tUm9vdFJlbmRlcmVyLCB1c2VDbGFzczogRG9tUm9vdFJlbmRlcmVyX30sXG4gICAgICAvKiBAdHMyZGFydF9Qcm92aWRlciAqLyB7cHJvdmlkZTogUm9vdFJlbmRlcmVyLCB1c2VFeGlzdGluZzogRG9tUm9vdFJlbmRlcmVyfSxcbiAgICAgIEV2ZW50TWFuYWdlcixcbiAgICAgIC8qIEB0czJkYXJ0X1Byb3ZpZGVyICovIHtwcm92aWRlOiBFVkVOVF9NQU5BR0VSX1BMVUdJTlMsIHVzZUNsYXNzOiBEb21FdmVudHNQbHVnaW4sIG11bHRpOiB0cnVlfSxcbiAgICAgIC8qIEB0czJkYXJ0X1Byb3ZpZGVyICovIHtwcm92aWRlOiBYSFIsIHVzZUNsYXNzOiBYSFJ9LFxuICAgICAgLyogQHRzMmRhcnRfUHJvdmlkZXIgKi8ge3Byb3ZpZGU6IEFQUF9JRCwgdXNlVmFsdWU6ICdhJ30sXG4gICAgICAvKiBAdHMyZGFydF9Qcm92aWRlciAqLyB7cHJvdmlkZTogU2hhcmVkU3R5bGVzSG9zdCwgdXNlRXhpc3Rpbmc6IERvbVNoYXJlZFN0eWxlc0hvc3R9LFxuICAgICAgRG9tU2hhcmVkU3R5bGVzSG9zdCxcbiAgICAgIEVMRU1FTlRfUFJPQkVfUFJPVklERVJTLFxuICAgICAgLyogQHRzMmRhcnRfUHJvdmlkZXIgKi8ge3Byb3ZpZGU6IERpcmVjdGl2ZVJlc29sdmVyLCB1c2VDbGFzczogTW9ja0RpcmVjdGl2ZVJlc29sdmVyfSxcbiAgICAgIC8qIEB0czJkYXJ0X1Byb3ZpZGVyICovIHtwcm92aWRlOiBWaWV3UmVzb2x2ZXIsIHVzZUNsYXNzOiBNb2NrVmlld1Jlc29sdmVyfSxcbiAgICAgIExvZyxcbiAgICAgIFRlc3RDb21wb25lbnRCdWlsZGVyLFxuICAgICAgLyogQHRzMmRhcnRfUHJvdmlkZXIgKi8ge3Byb3ZpZGU6IE5nWm9uZSwgdXNlRmFjdG9yeTogY3JlYXRlTmdab25lfSxcbiAgICAgIC8qIEB0czJkYXJ0X1Byb3ZpZGVyICovIHtwcm92aWRlOiBMb2NhdGlvblN0cmF0ZWd5LCB1c2VDbGFzczogTW9ja0xvY2F0aW9uU3RyYXRlZ3l9LFxuICAgICAgLyogQHRzMmRhcnRfUHJvdmlkZXIgKi8ge3Byb3ZpZGU6IEFuaW1hdGlvbkJ1aWxkZXIsIHVzZUNsYXNzOiBNb2NrQW5pbWF0aW9uQnVpbGRlcn0sXG4gICAgXTtcbiJdfQ==
#define CLAY_IMPLEMENTATION
#define CLAY_WASM
#include "clay.h"
#include <stdint.h>

#define EXPORT(name) __attribute__((export_name(name)))

/**
 * Invoke a callback from C back into javascript.
 */
__attribute__((import_module("env"), import_name("invokeCallback"))) extern void
invokeCallback(uint32_t callback_id, void *argument);

static void errorHandlerFunction(Clay_ErrorData data) {
  uint32_t callbackId = (uint32_t)data.userData;
  invokeCallback(callbackId, &data);
}

EXPORT("MinMemorySize")
uint32_t clayjs_MinMemorySize() { return Clay_MinMemorySize(); }

EXPORT("OpenElementWithId")
void clayjs_OpenElementWithId(const Clay_ElementId *id) {
  return Clay__OpenElementWithId(*id);
}

EXPORT("CloseElement")
void clayjs_CloseElement() { return Clay__CloseElement(); }

EXPORT("ConfigureOpenElement")
void clayjs_ConfigureOpenElement(const Clay_ElementDeclaration *declaration) {
  return Clay__ConfigureOpenElement(*declaration);
}

EXPORT("BeginLayout")
void clayjs_BeginLayout() { Clay_BeginLayout(); }

EXPORT("EndLayout")
void clayjs_EndLayout(Clay_RenderCommandArray *dest) {
  *dest = Clay_EndLayout();
}

EXPORT("Initialize")
void *clayjs_Initialize(size_t size,
                        void *memory,
                        Clay_Dimensions *layoutDimensions,
                        uint32_t errorHandlerId) {

  Clay_Arena arena = Clay_CreateArenaWithCapacityAndMemory(size, memory);
  Clay_ErrorHandler errorHandler = {.errorHandlerFunction =
                                        errorHandlerFunction,
                                    .userData = (void *)errorHandlerId};
  return Clay_Initialize(arena, *layoutDimensions, errorHandler);
}

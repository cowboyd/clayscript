#define CLAY_IMPLEMENTATION
#include "clay.h"
#include <stdint.h>

/**
 * Invoke a callback from C back into javascript.
 */
__attribute__((import_module("env"), import_name("invokeCallback"))) extern void
invokeCallback(uint32_t callback_id, void *argument);

static void errorHandlerFunction(Clay_ErrorData data) {
  uint32_t callbackId = (uint32_t)data.userData;
  invokeCallback(callbackId, &data);
}

CLAY_WASM_EXPORT("cbtest")
void cbtest(uint32_t id) { invokeCallback(id, 0); }

CLAY_WASM_EXPORT("clayjs_OpenElementWithId")
void clayjs_OpenElementWithId(const Clay_ElementId *id) {
  return Clay__OpenElementWithId(*id);
}

CLAY_WASM_EXPORT("clayjs_CloseElement")
void clayjs_CloseElement() { return Clay__CloseElement(); }

CLAY_WASM_EXPORT("clayjs_ConfigureOpenElement")
void clayjs_ConfigureOpenElement(const Clay_ElementDeclaration *declaration) {
  return Clay__ConfigureOpenElement(*declaration);
}

CLAY_WASM_EXPORT("clayjs_Initialize")
void *clayjs_Initialize(size_t size, void *memory,
                        Clay_Dimensions *layoutDimensions,
                        uint32_t errorHandlerId) {

  Clay_Arena arena = Clay_CreateArenaWithCapacityAndMemory(size, memory);
  Clay_ErrorHandler errorHandler = {.errorHandlerFunction =
                                        errorHandlerFunction,
                                    .userData = (void *)errorHandlerId};
  return Clay_Initialize(arena, *layoutDimensions, errorHandler);
}

#include "../clay.h"

float returnsNumbers() { return 6.5; }

void returnsStructs(Clay_Dimensions *result) {
  Clay_Dimensions d = {.width = 1024, .height = 768};
  *result = d;
}

uint32_t returnsPointersToStructs(void *memory) {
  uint32_t address = (uint32_t)memory;
  uint32_t ptr = address + sizeof(Clay_Dimensions);
  Clay_Dimensions d = {.width = 1024, .height = 768};
  Clay_Dimensions *dptr = (Clay_Dimensions *)ptr;
  *dptr = d;
  return ptr;
}

float acceptsStructArguments(Clay_Dimensions d, uint8_t returnWidth) {
  if (returnWidth == 1) {
    return d.width;
  } else {
    return d.height;
  }
}

float acceptsPointerArguments(Clay_Dimensions *d, uint8_t returnWidth) {
  if (returnWidth == 1) {
    return d->width;
  } else {
    return d->height;
  }
}

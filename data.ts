import {
  bool,
  char,
  enumOf,
  f32,
  i32,
  int16,
  ptr,
  struct,
  uint16,
  uint32,
  uint8,
  union,
} from "./typedef.ts";

export const ClayDimensions = struct({
  width: f32(),
  height: f32(),
});

export const ClayVector2 = struct({
  x: f32(),
  y: f32(),
});

export const ClayString = struct({
  isStaticallyAllocated: bool(),
  length: i32(),
  chars: ptr(char()),
});

export const ClayErrorData = struct({
  errorType: i32(),
  errorText: ClayString,
  userData: i32(),
});

export const ClayElementId = struct({
  id: i32(),
  offset: i32(),
  baseId: i32(),
  stringId: ClayString,
});

export const ClayColor = struct({
  r: f32(),
  g: f32(),
  b: f32(),
  a: f32(),
});

// Controls the sizing of this element along one axis inside its parent container.
export const ClaySizingMinMax = struct({
  min: f32(),
  max: f32(),
});

const ClaySizingType = enumOf(
  "SIZING_TYPE_FIT",
  "SIZING_TYPE_GROW",
  "SIZING_TYPE_PERCENT",
  "SIZING_TYPE_FIXED",
);

export const ClaySizingAxis = struct({
  size: union({
    minMax: ClaySizingMinMax,
    percent: f32(),
  }),
  type: ClaySizingType,
});

export const ClaySizing = struct({
  width: ClaySizingAxis,
  height: ClaySizingAxis,
});

export const ClayPadding = struct({
  left: uint16(),
  right: uint16(),
  top: uint16(),
  bottom: uint16(),
});

const ClayLayoutAlignmentX = enumOf(
  "ALIGN_X_LEFT",
  "ALIGN_X_RIGHT",
  "ALIGN_X_CENTER",
);

const ClayLayoutAlignmentY = enumOf(
  "ALIGN_Y_TOP",
  "ALIGN_Y_BOTTOM",
  "ALIGN_Y_CENTER",
);

const ClayChildAlignment = struct({
  x: ClayLayoutAlignmentX,
  y: ClayLayoutAlignmentY,
});

export const ClayLayoutDirection = enumOf(
  "LEFT_TO_RIGHT",
  "RIGHT_TO_LEFT",
);

export const ClayLayoutConfig = struct({
  sizing: ClaySizing,
  padding: ClayPadding,
  childGap: uint16(),
  childAlignment: ClayChildAlignment,
  layoutDirection: ClayLayoutDirection,
});

export const ClayCornerRadius = struct({
  topLeft: f32(),
  topRight: f32(),
  bottomLeft: f32(),
  bottomRight: f32(),
});

export const ClayAspectRatioConfig = struct({
  aspectRatio: f32(),
});

export const ClayImageElementConfig = struct({
  imageData: ptr(),
});

export const ClayFloatingAttachPointType = enumOf(
  "ATTACH_POINT_LEFT_TOP",
  "ATTACH_POINT_LEFT_CENTER",
  "ATTACH_POINT_LEFT_BOTTOM",
  "ATTACH_POINT_CENTER_TOP",
  "ATTACH_POINT_CENTER_CENTER",
  "ATTACH_POINT_CENTER_BOTTOM",
  "ATTACH_POINT_RIGHT_TOP",
  "ATTACH_POINT_RIGHT_CENTER",
  "ATTACH_POINT_RIGHT_BOTTOM",
);

export const ClayFloatingAttachPoints = struct({
  element: ClayFloatingAttachPointType,
  parent: ClayFloatingAttachPointType,
});

export const ClayPointerCaptureMode = enumOf(
  "POINTER_CAPTURE_MODE_CAPTURE",
  "POINTER_CAPTURE_MODE_PASSTHROUGH",
);

export const ClayFloatingAttachToElement = enumOf(
  "ATTACH_TO_NONE",
  "ATTACH_TO_PARENT",
  "ATTACH_TO_ELEMENT_WITH_ID",
  "ATTACH_TO_ROOT",
);

export const ClayFloatingClipToElement = enumOf(
  "CLIP_TO_NONE",
  "CLIP_TO_ATTACHED_PARENT",
);

export const ClayFloatingElementConfig = struct({
  offset: ClayVector2,
  expand: ClayDimensions,
  parentId: uint32(),
  zIndex: int16(),
  attachPoints: ClayFloatingAttachPoints,
  pointerCaptureMode: ClayPointerCaptureMode,
  attachTo: ClayFloatingAttachToElement,
  clipTo: ClayFloatingClipToElement,
});

export const ClayCustomElementConfig = struct({
  customData: ptr()
});

export const ClayClipElementConfig = struct({
  horizontal: bool(),
  vertical: bool(),
  childOffset: ClayVector2
});

export const ClayBorderWidth = struct({
  left: uint16(),
  right: uint16(),
  top: uint16(),
  bottom: uint16(),
  betweenChildren: uint16(),
});

export const ClayBorderElementConfig = struct({
  color: ClayColor,
  width: ClayBorderWidth,
});

export const ClayElementDeclaration = struct({
  layout: ClayLayoutConfig,
  backgroundColor: ClayColor,
  cornerRadius: ClayCornerRadius,
  aspectRatio: ClayAspectRatioConfig,
  image: ClayImageElementConfig,
  floating: ClayFloatingElementConfig,
  custom: ClayCustomElementConfig,
  clip: ClayClipElementConfig,
  border: ClayBorderElementConfig,
  userData: ptr(),
});

// typedef struct Clay_ElementDeclaration {
//     // Controls various settings that affect the size and position of an element, as well as the sizes and positions of any child elements.
//     Clay_LayoutConfig layout;
//     // Controls the background color of the resulting element.
//     // By convention specified as 0-255, but interpretation is up to the renderer.
//     // If no other config is specified, .backgroundColor will generate a RECTANGLE render command, otherwise it will be passed as a property to IMAGE or CUSTOM render commands.
//     Clay_Color backgroundColor;
//     // Controls the "radius", or corner rounding of elements, including rectangles, borders and images.
//     Clay_CornerRadius cornerRadius;
//     // Controls settings related to aspect ratio scaling.
//     Clay_AspectRatioElementConfig aspectRatio;
//     // Controls settings related to image elements.
//     Clay_ImageElementConfig image;
//     // Controls whether and how an element "floats", which means it layers over the top of other elements in z order, and doesn't affect the position and size of siblings or parent elements.
//     // Note: in order to activate floating, .floating.attachTo must be set to something other than the default value.
//     Clay_FloatingElementConfig floating;
//     // Used to create CUSTOM render commands, usually to render element types not supported by Clay.
//     Clay_CustomElementConfig custom;
//     // Controls whether an element should clip its contents, as well as providing child x,y offset configuration for scrolling.
//     Clay_ClipElementConfig clip;
//     // Controls settings related to element borders, and will generate BORDER render commands.
//     Clay_BorderElementConfig border;
//     // A pointer that will be transparently passed through to resulting render commands.
//     void *userData;
// } Clay_ElementDeclaration;

export const ClayRenderCommandArray = struct({
  capacity: i32(),
  length: i32(),
  internalArray: ptr(i32()),
});

// typedef struct Clay_RenderCommandArray {
//     // The underlying max capacity of the array, not necessarily all initialized.
//     int32_t capacity;
//     // The number of initialized elements in this array. Used for loops and iteration.
//     int32_t length;
//     // A pointer to the first element in the internal array.
//     Clay_RenderCommand* internalArray;
// } Clay_RenderCommandArray;

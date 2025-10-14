import {
  bool,
  char,
  enumOf,
  float,
  i32,
  int16,
  ptr,
  struct,
  uint16,
  uint32,
  union,
} from "./typedef.ts";

export const ClayDimensions = struct({
  width: float(),
  height: float(),
});

export const ClayVector2 = struct({
  x: float(),
  y: float(),
});

export const ClayString = struct({
  isStaticallyAllocated: bool(),
  length: i32(),
  chars: ptr(char()),
});

export const ClayStringSlice = struct({
  length: i32(),
  chars: ptr(char()),
  baseChars: ptr(char()),
});

// Represents the type of error clay encountered while computing layout.
export const ClayErrorType = enumOf(
  "ERROR_TYPE_TEXT_MEASUREMENT_FUNCTION_NOT_PROVIDED",
  "ERROR_TYPE_ARENA_CAPACITY_EXCEEDED",
  "ERROR_TYPE_ELEMENTS_CAPACITY_EXCEEDED",
  "ERROR_TYPE_TEXT_MEASUREMENT_CAPACITY_EXCEEDED",
  "ERROR_TYPE_DUPLICATE_ID",
  "ERROR_TYPE_FLOATING_CONTAINER_PARENT_NOT_FOUND",
  "ERROR_TYPE_PERCENTAGE_OVER_1",
  "ERROR_TYPE_INTERNAL_ERROR",
  "ERROR_TYPE_UNBALANCED_OPEN_CLOSE",
);

export const ClayErrorData = struct({
  errorType: ClayErrorType,
  errorText: ClayString,
  userData: ptr(),
});

export const ClayElementId = struct({
  id: i32(),
  offset: i32(),
  baseId: i32(),
  stringId: ClayString,
});

export const ClayColor = struct({
  r: float(),
  g: float(),
  b: float(),
  a: float(),
});

// Controls the sizing of this element along one axis inside its parent container.
export const ClaySizingMinMax = struct({
  min: float(),
  max: float(),
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
    percent: float(),
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

export const ClayTextElementConfig = struct({
  userData: ptr(),
  textColor: ClayColor,
  fontId: uint16(),
  fontSize: uint16(),
  letterSpacing: uint16(),
  lineHeight: uint16(),
  wrapMode: enumOf(
    "TEXT_WRAP_WORDS",
    "TEXT_WRAP_NEWLINES",
    "TEXT_WRAP_NONE",
  ),
  textAlignment: enumOf(
    "TEXT_ALIGN_LEFT",
    "TEXT_ALIGN_CENTER",
    "TEXT_ALIGN_RIGHT",
  ),
});

export const ClayCornerRadius = struct({
  topLeft: float(),
  topRight: float(),
  bottomLeft: float(),
  bottomRight: float(),
});

export const ClayAspectRatioElementConfig = struct({
  aspectRatio: float(),
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
  customData: ptr(),
});

export const ClayClipElementConfig = struct({
  horizontal: bool(),
  vertical: bool(),
  childOffset: ClayVector2,
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
  aspectRatio: ClayAspectRatioElementConfig,
  image: ClayImageElementConfig,
  floating: ClayFloatingElementConfig,
  custom: ClayCustomElementConfig,
  clip: ClayClipElementConfig,
  border: ClayBorderElementConfig,
  userData: ptr(),
});

export const ClayBoundingBox = struct({
  x: float(),
  y: float(),
  width: float(),
  height: float(),
});

export const ClayRectangleRenderData = struct({
  backgroundColor: ClayColor,
  cornerRadius: ClayCornerRadius,
});

export const ClayTextRenderData = struct({
  stringContents: ClayStringSlice,
  textColor: ClayColor,
  fontId: uint16(),
  fontSize: uint16(),
  letterSpacing: uint16(),
  lineHeight: uint16(),
});

export const ClayImageRenderData = struct({
  backgroundColor: ClayColor,
  cornerRadius: ClayCornerRadius,
  imageData: ptr(),
});

export const ClayCustomRenderData = struct({
  backgroundColor: ClayColor,
  cornerRadius: ClayCornerRadius,
  customData: ptr(),
});

export const ClayBorderRenderData = struct({
  color: ClayColor,
  cornerRadius: ClayCornerRadius,
  width: ClayBorderWidth,
});

export const ClayClipRenderData = struct({
  horizontal: bool(),
  vertical: bool(),
});

export const ClayRenderData = union({
  rectangle: ClayRectangleRenderData,
  text: ClayTextRenderData,
  image: ClayImageRenderData,
  custom: ClayCustomRenderData,
  border: ClayBorderRenderData,
  clip: ClayClipRenderData,
});

export const ClayRenderCommandType = enumOf(
  "RENDER_COMMAND_TYPE_NONE",
  "RENDER_COMMAND_TYPE_RECTANGLE",
  "RENDER_COMMAND_TYPE_BORDER",
  "RENDER_COMMAND_TYPE_TEXT",
  "RENDER_COMMAND_TYPE_IMAGE",
  "RENDER_COMMAND_TYPE_SCISSOR_START",
  "RENDER_COMMAND_TYPE_SCISSOR_END",
  "RENDER_COMMAND_TYPE_CUSTOM",
);

export const ClayRenderCommand = struct({
  boundingBox: ClayBoundingBox,
  renderData: ClayRenderData,
  userData: ptr(),
  id: uint32(),
  zIndex: int16(),
  commandType: ClayRenderCommandType,
});

export const ClayRenderCommandArray = struct({
  capacity: i32(),
  length: i32(),
  internalArray: ptr(ClayRenderCommand),
});

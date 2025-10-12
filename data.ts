import { bool, f32, i32, ptr, struct, union } from "./struct.ts";

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
  chars: ptr(i32()), //TODO: ptr uint8
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

export const ClaySizingMinMax = struct({
  min: f32(),
  max: f32(),
});

// Controls the sizing of this element along one axis inside its parent container.
// typedef struct Clay_SizingAxis {
//     union {
//         Clay_SizingMinMax minMax; // Controls the minimum and maximum size in pixels that this element is allowed to grow or shrink to, overriding sizing types such as FIT or GROW.
//         float percent; // Expects 0-1 range. Clamps the axis size to a percent of the parent container's axis size minus padding and child gaps.
//     } size;
//     Clay__SizingType type; // Controls how the element takes up space inside its parent container.
// } Clay_SizingAxis;

export const ClaySizingAxis = struct({
  size: union(ClaySizingMinMax, f32()),
  type: i32(),
});

export const ClaySizing = struct({
  width: ClaySizingAxis,
  height: ClaySizingAxis,
});

export const ClayPadding = struct({
  left: i32(),
  right: i32(),
  top: i32(),
  bottom: i32(),
});

export const ClayLayoutConfig = struct({
  sizing: ClaySizing,
  padding: ClayPadding,
  childGap: i32(),
  //  childAlignment: ClayChildAlignment;
  //   typedef struct Clay_LayoutConfig {
  //     Clay_Sizing sizing; // Controls the sizing of this element inside it's parent container, including FIT, GROW, PERCENT and FIXED sizing.
  //     Clay_Padding padding; // Controls "padding" in pixels, which is a gap between the bounding box of this element and where its children will be placed.
  //     uint16_t childGap; // Controls the gap in pixels between child elements along the layout axis (horizontal gap for LEFT_TO_RIGHT, vertical gap for TOP_TO_BOTTOM).
  //     Clay_ChildAlignment childAlignment; // Controls how child elements are aligned on each axis.
  //     Clay_LayoutDirection layoutDirection; // Controls the direction in which child elements will be automatically laid out.
  // } Clay_LayoutConfig;
});

export const ClayElementDeclaration = struct({
  layout: ClayLayoutConfig,
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

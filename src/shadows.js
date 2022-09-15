const {
  normalize,
  getValuesForBezierCurve,
  roundTo,
  clamp,
  range,
  formatHslValues,
} = require("./utilities");

function calculateShadowOffsets({
  size,
  oomph,
  crispy,
  layerIndex,
  lightSource,
  numOfLayers,
}) {
  const maxOffsetBySize = {
    small: normalize(oomph, 0, 1, 3, 5),
    medium: normalize(oomph, 0, 1, 15, 25),
    large: normalize(oomph, 0, 1, 50, 150),
  };

  // We don't want to use linear interpolation here because we want
  // the shadows to cluster near the front and fall off. Otherwise,
  // the most opaque part of the shadow is in the middle of the
  // group, rather than being near the element.
  // We'll use a bezier curve and pluck points along it.
  const curve = {
    startPoint: [0, 1],
    endPoint: [1, 0],
    controlPoint1: [
      normalize(crispy, 0, 1, 0.25, 0),
      normalize(crispy, 0, 1, 0.25, 0),
    ],
    controlPoint2: [
      normalize(crispy, 0, 1, 0.25, 0),
      normalize(crispy, 0, 1, 0.25, 0),
    ],
  };
  const t = layerIndex / (numOfLayers - 1);
  const [ratio] = getValuesForBezierCurve(curve, t);

  const max = maxOffsetBySize[size];

  // Now, for x/y offset... we have this lightSource value, with
  // X and Y from -1 to 1.
  const xOffsetMin = normalize(lightSource.x, -1, 1, 1, -1);
  const xOffsetMax = normalize(lightSource.x, -1, 1, max, max * -1);
  const yOffsetMin = normalize(lightSource.y, -1, 1, 1, -1);
  const yOffsetMax = normalize(lightSource.y, -1, 1, max, max * -1);

  const x = roundTo(normalize(ratio, 0, 1, xOffsetMin, xOffsetMax), 1);
  const y = roundTo(normalize(ratio, 0, 1, yOffsetMin, yOffsetMax), 1);

  return { x, y };
}
function calculateBlurRadius({ x, y, crispy }) {
  // The blur radius should depend on the x/y offset.
  // Calculate the hypothenuse length and use it as the blur radius?
  const hypothenuse = (x ** 2 + y ** 2) ** 0.5;

  const radius = normalize(crispy, 0, 1, hypothenuse * 1.5, hypothenuse * 0.75);

  return roundTo(radius, 1);
}
function calculateShadowOpacity({
  oomph,
  crispy,
  tintShadows,
  layerIndex,
  numOfLayers,
  minLayers,
  maxLayers,
}) {
  const baseOpacity = normalize(oomph, 0, 1, 0.4, 1.25);

  const initialOpacityMultiplier = normalize(crispy, 0, 1, 0, 1);
  const finalOpacityMultiplier = normalize(crispy, 0, 1, 1, 0);

  // Crispy determines which shadows are more visible, and
  // which shadows are less visible.
  const layerOpacityMultiplier = normalize(
    layerIndex,
    0,
    numOfLayers,
    initialOpacityMultiplier,
    finalOpacityMultiplier
  );

  let opacity = baseOpacity * layerOpacityMultiplier;

  // So, here's the problem.
  // The `resolution` param lets us change how many layers are
  // generated. Every additional layer should reduce the opacity
  // of all layers, so that "resolution" doesn't change the
  // perceived opacity.
  const averageLayers = (minLayers + maxLayers) / 2;
  const ratio = averageLayers / numOfLayers;

  let layerOpacity = opacity * ratio;

  // This is the opacity if we're using color-tinted shadows.
  // If NOT, though, we want the shadows to be WAY less opaque!
  if (!tintShadows) {
    layerOpacity *= 0.3;
  }

  return clamp(roundTo(layerOpacity, 2), 0, 1);
}
function calculateSpread({ crispy, layerIndex, numOfLayers }) {
  // return 0;

  if (layerIndex === 0) {
    return 0;
  }

  const maxReduction = normalize(crispy, 0, 1, 0, -5);
  const actualReduction = normalize(
    layerIndex + 1,
    1,
    numOfLayers,
    0,
    maxReduction
  );

  return roundTo(actualReduction, 1);
}
function generateShadows({
  shadowColorCP,
  size,
  lightSource,
  resolution,
  oomph,
  crispy,
  tintShadows,
}) {
  const SHADOW_LAYER_LIMITS = {
    small: {
      min: 2,
      max: 3,
    },
    medium: {
      min: 2,
      max: 5,
    },
    large: {
      min: 3,
      max: 10,
    },
  };

  const numOfLayers = Math.round(
    normalize(
      resolution,
      0,
      1,
      SHADOW_LAYER_LIMITS[size].min,
      SHADOW_LAYER_LIMITS[size].max
    )
  );

  return range(numOfLayers).map((layerIndex) => {
    const opacity = calculateShadowOpacity({
      oomph,
      crispy,
      tintShadows,
      layerIndex,
      numOfLayers,
      minLayers: SHADOW_LAYER_LIMITS[size].min,
      maxLayers: SHADOW_LAYER_LIMITS[size].max,
    });

    const { x, y } = calculateShadowOffsets({
      size,
      oomph,
      crispy,
      lightSource,
      layerIndex,
      numOfLayers,
    });

    const blurRadius = calculateBlurRadius({
      x,
      y,
      size,
      oomph,
      crispy,
      layerIndex,
      numOfLayers,
    });

    const spread = calculateSpread({
      oomph,
      crispy,
      layerIndex,
      numOfLayers,
    });
    const spreadString = spread !== 0 ? `${spread}px ` : "";
    return `${x}px ${y}px ${blurRadius}px ${spreadString}hsl(var(${shadowColorCP}) / ${opacity})`;
  });
}

function getShadowBackgroundHslValues(backgroundHsl, oomph, tintShadows) {
  if (!tintShadows) {
    return "0deg 0% 0%";
  }

  let [hue, sat, lit] = backgroundHsl;

  const maxLightness = normalize(oomph, 0, 1, 85, 50);

  const saturationEnhancement = normalize(lit, 50, 100, 1, 0.25);

  sat = Math.round(clamp(sat * saturationEnhancement, 0, 100));
  // lit = Math.round(clamp(lit - 35, 0, 100));
  lit = Math.round(clamp(normalize(lit, 0, 100, 0, maxLightness) - 5, 0, 100));

  return formatHslValues(hue, sat, lit);
}

module.exports = { generateShadows, getShadowBackgroundHslValues };

const plugin = require("tailwindcss/plugin");
const tinyColor = require("tinycolor2");
const { generateShadows, getShadowBackgroundHslValues } = require("./shadows");

function createColorValues(colors) {
  return Object.keys(colors).reduce((acc, color) => {
    const value = colors[color];
    if (typeof value === "string") acc[color] = value;

    if (typeof value === "object") {
      Object.keys(value).forEach((shade) => {
        acc[`${color}-${shade}`] = value[shade];
      });
    }

    return acc;
  }, {});
}

const elevationPlugin = ({ x = 2, y = 4, ...globalSettings } = {}) =>
  plugin(
    function ({ matchComponents, theme }) {
      const tintShadows = globalSettings.tintShadows ?? true;
      const shadowColorCP = `--tw-elevation-color`;
      const oomph = globalSettings.oomph ?? 0.5;
      const crispy = globalSettings.crispy ?? 0.5;
      const resolution = globalSettings.resolution ?? 0.5;
      const lightSource = { x: -x, y: -y };

      matchComponents(
        {
          elevation: ([size = "medium", ...localSettings]) => {
            const settings = {
              resolution: localSettings.resolution ?? resolution,
              oomph: localSettings.oomph ?? oomph,
              crispy: localSettings.crispy ?? crispy,
            };

            const shadows = generateShadows({
              size,
              ...settings,
              lightSource,
              tintShadows,
              shadowColorCP,
            });

            return {
              [shadowColorCP]: `0deg 0% 0%`,
              boxShadow: shadows.join(", "),
            };
          },
        },
        { values: theme("elevations") }
      );
      matchComponents(
        {
          elevation: (color) => {
            const { h, s, l } = tinyColor(color).toHsl();
            const hslColor = getShadowBackgroundHslValues(
              [h, s * 100, l * 100],
              oomph,
              tintShadows
            );
            return { [shadowColorCP]: hslColor };
          },
        },
        { values: createColorValues(theme("colors")) }
      );
    },
    {
      theme: {
        elevations: {
          small: ["small"],
          medium: ["medium"],
          large: ["large"],
        },
      },
    }
  );

module.exports = elevationPlugin;

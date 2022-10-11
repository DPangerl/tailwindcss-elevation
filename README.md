# tailwindcss-elevation

A tailwind plugin that provides beautiful shadows to elevate your components.
It's heavily inspired by this blog post [Designing Beautiful Shadows in CSS](https://www.joshwcomeau.com/css/designing-shadows/) by Josh Comeau and based on his awesome [Shadow palette generator](https://www.joshwcomeau.com/shadow-palette/). 

## Installation

Install the plugin from npm:

```bash
npm install -D @dp/tailwindcss-elevation
```

Then add the plugin to your tailwind.config.js file. 

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      elevation: {},
    },
  },

  plugins: [require("@dp/tailwindcss-elevation")(config)],
};
```

You can configure the plugin or keep the default settings.

## Configuration

The configuration is globally added to all variations of the elevation classes.

```js
config = {
  x: 2,
  y: 4,
  crisp: 0.5,
  oomph: 0.5,
  resolution: 0.5,
  shadowColorCP: "--tw-elevation-color",
};
```


## Usage

The elevation plugin creates three level `small`, `medium`, `large`. 
To use elevation for your component, add the `elevation-[small | medium | large]` class to your component.
In order to create more realistic shadows, you can add a elevation-color class to your component. This color should be the same as the background color wich receives the shadow.

```html
<div class="bg-blue-900">
    <div class="bg-white p-4 elevation-small elevation-blue-900">
        <p>Some text</p>
    </div>
</div>
```

## Todo

Until now, elevation only creates 3 levels of elevation. In the next step, you will be able to add more levels and be able to configure them individually.

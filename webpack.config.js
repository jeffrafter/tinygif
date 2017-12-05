/*
If you want to make an example:

module.exports = {
  entry: "./src/canvas.js",
  output: {
    filename: "example/bundle.js",
  },
  module: {
    loaders: [
      {
        test: /\.worker\.js$/,
        loader: 'worker-loader',
        options: { inline: true }
      }
    ]
  }
}
*/

/* If you want to export a version */
module.exports = {
  entry: "./src/canvas.js",
  output: {
    filename: "example/bundle.js",
  },
  module: {
    loaders: [
      {
        test: /\.worker\.js$/,
        loader: 'worker-loader',
        options: { inline: true }
      }
    ]
  }
}

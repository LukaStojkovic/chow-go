// Jest runs CommonJS and cannot evaluate import(); Metro handles it natively.
function dynamicImportToRequire({ types: t }) {
  return {
    visitor: {
      CallExpression(path) {
        if (path.node.callee.type !== "Import") return;
        const load = t.arrowFunctionExpression([], t.callExpression(t.identifier("require"), path.node.arguments));
        path.replaceWith(
          t.callExpression(
            t.memberExpression(
              t.callExpression(t.memberExpression(t.identifier("Promise"), t.identifier("resolve")), []),
              t.identifier("then"),
            ),
            [load],
          ),
        );
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === "test";
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins: [...(isTest ? [dynamicImportToRequire] : []), "react-native-worklets/plugin"],
  };
};

// Build-time values from CI: the Android versionCode and the commit the APK
// was built from (shown in Settings → About). No secrets are read here.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    versionCode: Number(process.env.IRIS_VERSION_CODE || 1),
  },
  extra: {
    ...config.extra,
    commit: (process.env.IRIS_COMMIT || "dev").slice(0, 7),
  },
});

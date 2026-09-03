const { withEntitlementsPlist } = require("@expo/config-plugins");

// expo-notifications always adds the `aps-environment` entitlement, which
// requires the Push Notifications capability. Apple's free "Personal Team"
// signing does not support that capability, so local/sideload builds fail
// to sign. Strip it here (after expo-notifications runs) so `expo prebuild`
// keeps producing a project that can be signed with a free Apple ID.
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults["aps-environment"];
    return config;
  });
};

# Upgrade to WorkOS v6

```grit
language js

or {
  `workos.sso.getAuthorizationURL($params)` => `workos.sso.getAuthorizationUrl($params)` where {
    // $program <: maybe contains `const $params = { $vals }`,
    $program <: maybe contains or {
      `clientID` => `clientId`,
      `redirectURI` => `redirectUri`,
    }
  },
  `profile.profile.$prop` where { $prop <: `first_name` => `firstName` }
}
```
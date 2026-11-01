# Messenger reference study and Buildverse adaptation

Reference: https://messenger.abeto.co/ — public capture on 2 November 2026.

## What was observed

The opening screen presents a rotating miniature world, illustrated edges, restrained color, oversized title typography, and one prominent Begin action. Browser interaction could not pass the closed-shadow-root entry control, so gameplay and later story flows were not runtime-tested.

The public HTML names two JavaScript assets: `webgl-CS4l6lxD.js` and `App3D-DwM1eiaC.js`. Static inspection identifies Three.js rendering/camera classes, custom outline shader code that accepts color and information textures with depth, normal and ID-related parameters, followed-target/spherical camera fields, and dialogue/quest event handlers. Presence in a shipped bundle does not prove that every feature is executed. The outline code is consistent with the illustrated appearance visible in the opening screen.

## REA evidence and limits

REA analyzed the downloaded public HTML and two scripts without executing the bundles. Both JavaScript files parsed, but semantic analysis of the 1,926,191-byte application bundle exhausted its 1 GiB analysis heap. Application/semantic coverage is partial; no complete source reconstruction is claimed.

- Parent analysis: `ev_ec2c314b1a71ea386a2b7847d3de67e43cfb4c7f1888f6a1940aec510676426e`.
- Summary: `ev_bbc21c3ea3ae8dc8401ad302609f372a3ff5c33fb4abd12bd4c8a03df96cdcb0`.
- Inventory page: `ev_5e063c1d093985131a01b4ee120655ced28a0a2a1688b67938707bbed09cd3b9`.
- Captured artifact digest: `1df0e4efb26927f46066db82b48f872bf0d5f7c8b42f1c9103c9124964d829a5`.

The local evidence export is `../work/abeto-rea-evidence.json`; captured public scripts remain outside this repository. The capture manifest records individual file hashes. No reference artwork, models, audio, fonts, or application code is shipped with Buildverse.

## Buildverse implementation choices

1. **Illustrated world:** an original five-sample color-edge pass adds fine ink lines, slight warmth and stationary paper grain. This is a simpler implementation than the reference's observed shader inputs; it is not a reconstruction of that shader. Night bloom remains available and is allocated when first needed.
2. **Contextual wayfinding:** rooftop names appear for hovered buildings, nearby entrances and inspected exteriors. Removing persistent labels gives architectural silhouettes more room. The directory remains the complete, accessible destination list, with a switch to show all labels.
3. **Camera-led arrival:** bounded, elapsed-time-based smoothstep transitions add a small lift and settle at an exact destination. Orbit distance constraints apply after the flight so they do not prematurely clamp a wide establishing shot.
4. **Visitor choice:** illustrated rendering and all-label mode can be changed in Directory → World appearance. The original rendering remains available.

A spherical world would require rebuilding terrain, collisions, traffic and floor navigation. This iteration retains Buildverse's existing city while adapting the visual and interaction principles above. A later pass could add authored NPC conversations and opt-in spatial sound; those features were not implemented in this change.

## Validation

Camera easing has automated boundary, timing, monotonicity and duration tests. Existing movement, collision, content, discoveries, weather and boat tests remain in place. Browser verification covers rendering modes, contextual labels, arrival transitions, night effects and mobile layout. Actual frame rate remains device-dependent; no benchmark equivalence to Messenger is claimed.

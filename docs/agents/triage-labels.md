# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.

## Autonomous controller opt-in (disabled implementation)

`ready-for-agent` alone never authorizes automatic dispatch. See
[controller contract](AUTONOMOUS_DEVELOPMENT.md). No labels are created or
modified by the controller implementation PR.

| Label | Meaning |
| --- | --- |
| `autonomy:enabled` | Human opt-in; still requires a complete handoff and current authenticated approval |
| `autonomy:active` | Human-visible hold for outstanding work |
| `autonomy:awaiting-human` | Human-visible hold for final review |
| `autonomy:needs-human` | Human-visible hold for ambiguity or failed gates |

The current controller reports states in dry-run output and durable event
records; it does not automatically maintain these summary labels. Removing a
label never removes a reservation or resets a repair counter. #58 remains a
container and is excluded even if labeled ready and enabled.

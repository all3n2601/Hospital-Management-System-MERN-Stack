/**
 * authorize.ts
 *
 * Role-based access control middleware factory.
 *
 * Usage:
 *   router.get('/patients', authenticate, authorize('patients', 'read'), handler)
 *
 * The `authenticate` middleware (Phase 1C) must run first and set `req.user`.
 * For own-only resources the middleware sets `req.ownOnly = true` and calls
 * `next()` — the controller/service is responsible for the actual filtering.
 */

import { Request, Response, NextFunction } from "express";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Role = "admin" | "doctor" | "nurse" | "receptionist" | "patient";

export type Resource =
  | "users"
  | "patients"
  | "appointments"
  | "billing"
  | "lab"
  | "prescriptions"
  | "inventory"
  | "documents"
  | "analytics"
  | "settings";

export type Action =
  | "read"
  | "write"
  | "create_draft"
  | "dispense"
  | "issue"
  | "void";

/** Inline definition — will be superseded by the shared type once Phase 1C lands */
export interface AuthUser {
  _id: string;
  role: Role;
}

// Extend Express Request with auth context
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      /**
       * Set to `true` by `authorize` when the role grants access only to
       * resources owned by the authenticated user.  The controller/service
       * must honour this flag and filter results accordingly.
       */
      ownOnly?: boolean;
    }
  }
}

// ---------------------------------------------------------------------------
// Permission matrix
//
// Structure:
//   MATRIX[resource][role] = Action[] | 'own-read' | 'own-rw' | 'all' | false
//
// Sentinel values:
//   'all'    → any action is permitted
//   false    → no access
//   Action[] → only these specific actions are permitted
//   'own-read' → read access, but ownOnly flag is set
//   'own-rw'   → read + write access, but ownOnly flag is set
// ---------------------------------------------------------------------------

type Permission =
  | "all"
  | "own-read"
  | "own-rw"
  | false
  | Action[];

type PermissionMatrix = Record<Resource, Record<Role, Permission>>;

const MATRIX: PermissionMatrix = {
  //                   admin     doctor          nurse       receptionist  patient
  users: {
    admin:         "all",
    doctor:        false,
    nurse:         false,
    receptionist:  false,
    patient:       false,
  },
  patients: {
    admin:         "all",
    doctor:        ["read"],
    nurse:         ["read"],
    receptionist:  ["read", "write"],
    patient:       "own-rw",
  },
  appointments: {
    admin:         "all",
    doctor:        "own-rw",
    nurse:         false,
    receptionist:  ["read", "write"],
    patient:       "own-rw",
  },
  billing: {
    admin:         "all",
    doctor:        false,
    nurse:         false,
    receptionist:  ["read", "write"],
    patient:       "own-read",
  },
  lab: {
    admin:         "all",
    doctor:        ["read", "write"],
    nurse:         ["read"],
    receptionist:  false,
    patient:       "own-read",
  },
  prescriptions: {
    admin:         "all",
    doctor:        ["read", "write"],
    nurse:         ["dispense"],
    receptionist:  false,
    patient:       "own-read",
  },
  inventory: {
    admin:         "all",
    doctor:        false,
    nurse:         ["read"],
    receptionist:  false,
    patient:       false,
  },
  documents: {
    admin:         "all",
    doctor:        ["issue", "void", "read"], // own issue+void; read all
    nurse:         false,
    receptionist:  false,
    patient:       "own-read",
  },
  analytics: {
    admin:         "all",
    doctor:        false,
    nurse:         false,
    receptionist:  false,
    patient:       false,
  },
  settings: {
    admin:         "all",
    doctor:        false,
    nurse:         false,
    receptionist:  false,
    patient:       false,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isActionAllowed(permission: Permission, action: Action): boolean {
  if (permission === false) return false;
  if (permission === "all") return true;
  if (permission === "own-read") return action === "read";
  if (permission === "own-rw") return action === "read" || action === "write";
  // Array of specific actions
  return (permission as Action[]).includes(action);
}

function isOwnOnly(permission: Permission): boolean {
  return permission === "own-read" || permission === "own-rw";
}

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

/**
 * Returns an Express middleware that checks whether the authenticated user
 * (attached to `req.user` by the `authenticate` middleware) is allowed to
 * perform `action` on `resource`.
 *
 * On denial responds with HTTP 403:
 *   { success: false, error: { code: 'FORBIDDEN', message: '...' } }
 *
 * On own-only grant sets `req.ownOnly = true` and calls `next()`.
 */
export function authorize(resource: Resource, action: Action) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
      return;
    }

    const { role } = user;

    // Guard against unknown roles not in the type union at runtime
    if (!(role in MATRIX[resource])) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Role '${role}' is not recognised.`,
        },
      });
      return;
    }

    const permission: Permission = MATRIX[resource][role];

    if (!isActionAllowed(permission, action)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Role '${role}' is not permitted to perform '${action}' on '${resource}'.`,
        },
      });
      return;
    }

    // Pass through with ownOnly flag when applicable
    if (isOwnOnly(permission)) {
      req.ownOnly = true;
    }

    next();
  };
}

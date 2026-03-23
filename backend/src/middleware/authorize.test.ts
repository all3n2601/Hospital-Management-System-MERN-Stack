/**
 * authorize.test.ts
 *
 * Unit tests for the authorize middleware factory.
 * No external dependencies beyond Jest — req/res/next are mocked inline.
 */

import { authorize, AuthUser } from "./authorize";
import { Request, Response, NextFunction } from "express";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq(user?: AuthUser): Partial<Request> {
  return { user } as Partial<Request>;
}

function makeRes(): {
  res: Partial<Response>;
  status: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const res = { status } as unknown as Partial<Response>;
  return { res, status, json };
}

function makeNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("authorize middleware", () => {
  // -------------------------------------------------------------------------
  // Admin
  // -------------------------------------------------------------------------
  describe("admin role", () => {
    const adminUser: AuthUser = { _id: "admin-id", role: "admin" };

    const resources = [
      "users",
      "patients",
      "appointments",
      "billing",
      "lab",
      "prescriptions",
      "inventory",
      "documents",
      "analytics",
      "settings",
    ] as const;

    const actions = [
      "read",
      "write",
      "create_draft",
      "dispense",
      "issue",
      "void",
    ] as const;

    test.each(resources)(
      "admin can read and write on resource: %s",
      (resource) => {
        for (const action of actions) {
          const req = makeReq(adminUser);
          const { res, status } = makeRes();
          const next = makeNext();

          authorize(resource, action)(
            req as Request,
            res as Response,
            next
          );

          expect(status).not.toHaveBeenCalled();
          expect(next).toHaveBeenCalledTimes(1);

          // ownOnly should NOT be set for admin
          expect((req as Request).ownOnly).toBeUndefined();

          (next as jest.Mock).mockClear();
        }
      }
    );
  });

  // -------------------------------------------------------------------------
  // Doctor
  // -------------------------------------------------------------------------
  describe("doctor role", () => {
    const doctor: AuthUser = { _id: "doc-id", role: "doctor" };

    test("doctor can write prescriptions", () => {
      const req = makeReq(doctor);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("prescriptions", "write")(req as Request, res as Response, next);

      expect(status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    });

    test("doctor can read prescriptions", () => {
      const req = makeReq(doctor);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("prescriptions", "read")(req as Request, res as Response, next);

      expect(status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    });

    test("doctor cannot write billing", () => {
      const req = makeReq(doctor);
      const { res, status, json } = makeRes();
      const next = makeNext();

      authorize("billing", "write")(req as Request, res as Response, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: "FORBIDDEN" }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("doctor gets ownOnly flag on appointments read", () => {
      const req = makeReq(doctor);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("appointments", "read")(req as Request, res as Response, next);

      expect(status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect((req as Request).ownOnly).toBe(true);
    });

    test("doctor gets ownOnly flag on appointments write", () => {
      const req = makeReq(doctor);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("appointments", "write")(req as Request, res as Response, next);

      expect(status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect((req as Request).ownOnly).toBe(true);
    });

    test("doctor cannot access users", () => {
      const req = makeReq(doctor);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("users", "read")(req as Request, res as Response, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Nurse
  // -------------------------------------------------------------------------
  describe("nurse role", () => {
    const nurse: AuthUser = { _id: "nurse-id", role: "nurse" };

    test("nurse can read lab orders", () => {
      const req = makeReq(nurse);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("lab", "read")(req as Request, res as Response, next);

      expect(status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    });

    test("nurse cannot write lab orders", () => {
      const req = makeReq(nurse);
      const { res, status, json } = makeRes();
      const next = makeNext();

      authorize("lab", "write")(req as Request, res as Response, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: "FORBIDDEN" }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("nurse can dispense prescriptions", () => {
      const req = makeReq(nurse);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("prescriptions", "dispense")(req as Request, res as Response, next);

      expect(status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    });

    test("nurse cannot write prescriptions", () => {
      const req = makeReq(nurse);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("prescriptions", "write")(req as Request, res as Response, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Receptionist
  // -------------------------------------------------------------------------
  describe("receptionist role", () => {
    const receptionist: AuthUser = { _id: "rec-id", role: "receptionist" };

    test("receptionist can create_draft billing", () => {
      const req = makeReq(receptionist);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("billing", "create_draft")(req as Request, res as Response, next);

      expect(status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    });

    test("receptionist cannot write billing", () => {
      const req = makeReq(receptionist);
      const { res, status, json } = makeRes();
      const next = makeNext();

      authorize("billing", "write")(req as Request, res as Response, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: "FORBIDDEN" }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("receptionist cannot access analytics", () => {
      const req = makeReq(receptionist);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("analytics", "read")(req as Request, res as Response, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Patient — own-only
  // -------------------------------------------------------------------------
  describe("patient role — own-only", () => {
    const patient: AuthUser = { _id: "patient-id", role: "patient" };

    test("patient gets ownOnly flag on patients read", () => {
      const req = makeReq(patient);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("patients", "read")(req as Request, res as Response, next);

      expect(status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect((req as Request).ownOnly).toBe(true);
    });

    test("patient gets ownOnly flag on appointments read", () => {
      const req = makeReq(patient);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("appointments", "read")(req as Request, res as Response, next);

      expect(status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect((req as Request).ownOnly).toBe(true);
    });

    test("patient gets ownOnly flag on appointments write", () => {
      const req = makeReq(patient);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("appointments", "write")(req as Request, res as Response, next);

      expect(status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect((req as Request).ownOnly).toBe(true);
    });

    test("patient cannot write prescriptions", () => {
      const req = makeReq(patient);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("prescriptions", "write")(req as Request, res as Response, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test("patient cannot access users", () => {
      const req = makeReq(patient);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("users", "read")(req as Request, res as Response, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test("patient cannot access analytics", () => {
      const req = makeReq(patient);
      const { res, status } = makeRes();
      const next = makeNext();

      authorize("analytics", "read")(req as Request, res as Response, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // No user / unknown role
  // -------------------------------------------------------------------------
  describe("missing or unknown user", () => {
    test("missing req.user returns 401", () => {
      const req = makeReq(undefined);
      const { res, status, json } = makeRes();
      const next = makeNext();

      authorize("patients", "read")(req as Request, res as Response, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: "UNAUTHORIZED" }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("unknown role is denied with 403", () => {
      // Cast to bypass TypeScript — simulates an unexpected runtime value
      const unknownUser = { _id: "x", role: "superuser" } as unknown as AuthUser;
      const req = makeReq(unknownUser);
      const { res, status, json } = makeRes();
      const next = makeNext();

      authorize("patients", "read")(req as Request, res as Response, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: "FORBIDDEN" }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});

/**
 * Migration 001: Consolidate Auth
 *
 * Reads all `doctors` and `nurses` documents, creates corresponding `User`
 * records (role: 'doctor' | 'nurse'), and writes the new `userId` back to
 * each professional document.  Existing `users` (patients) already conform.
 *
 * After backfill the migration marks Doctor/Nurse docs so subsequent runs
 * are skipped (idempotent via `userId` field check).
 *
 * Usage:
 *   ts-node 001-consolidate-auth.ts --mongo-uri mongodb://localhost:27017/hms
 *   ts-node 001-consolidate-auth.ts --mongo-uri ... --dry-run
 */

import mongoose, {
  ClientSession,
  Document,
  Schema,
  Types,
  model,
} from "mongoose";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MigrationResult {
  doctorsMigrated: number;
  nursesMigrated: number;
  skipped: number;
  errors: string[];
}

interface MigrationOptions {
  dryRun?: boolean;
}

// ---------------------------------------------------------------------------
// Minimal inline schemas (avoids importing the full app)
// ---------------------------------------------------------------------------
//
// NOTE: These schemas are intentionally minimal — they only declare the fields
// this migration reads or writes.  They are NOT the production schemas.
//
// UserSchema omits optional fields that exist on the production User model,
// such as `emergencyContact` and `medicalHistory`.  Those fields are not
// needed here and omitting them keeps the migration self-contained.
//
// NurseSchema omits the `department` field that exists on actual nurse
// documents.  This is intentional: the migration does not move department
// data.  The raw field remains accessible via `.lean()` if needed in future.
// ---------------------------------------------------------------------------

interface IUser extends Document {
  userName: string;
  email: string;
  password: string;
  role: "admin" | "doctor" | "nurse" | "receptionist" | "patient";
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

const UserSchema = new Schema<IUser>({
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "doctor", "nurse", "receptionist", "patient"],
    required: true,
  },
  phoneNumber: { type: String, default: "" },
  dateOfBirth: { type: Date },
  gender: { type: String, default: "" },
  address: {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    zipCode: { type: String, default: "" },
  },
});

// Use getModel helper to avoid OverwriteModelError when re-running in tests
const getUserModel = () =>
  mongoose.models["User"] ?? model<IUser>("User", UserSchema, "users");

// ---------------------------------------------------------------------------
// Doctor schema (legacy)
// ---------------------------------------------------------------------------

interface IDoctor extends Document {
  name: string;
  doctorId: string;
  email: string;
  phoneno?: string;
  dob?: Date;
  gender?: string;
  address?: { city?: string; state?: string; street?: string; zipCode?: string };
  password: string;
  specialization: string;
  role: string;
  userId?: Types.ObjectId; // added by migration
}

const DoctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true },
    doctorId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phoneno: { type: String, default: "" },
    dob: { type: Date },
    gender: { type: String },
    address: {
      city: { type: String },
      state: { type: String },
      street: { type: String },
    },
    password: { type: String, required: true },
    specialization: { type: String, required: true },
    role: { type: String, default: "doctor" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { strict: false }
);

const getDoctorModel = () =>
  mongoose.models["Doctor"] ?? model<IDoctor>("Doctor", DoctorSchema, "doctors");

// ---------------------------------------------------------------------------
// Nurse schema (legacy)
// ---------------------------------------------------------------------------

interface INurse extends Document {
  name: string;
  email: string;
  phoneno?: string;
  dob?: Date;
  gender?: string;
  address?: { city?: string; state?: string; street?: string; zipCode?: string };
  password: string;
  ward?: string;
  role: string;
  userId?: Types.ObjectId; // added by migration
}

const NurseSchema = new Schema<INurse>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneno: { type: String, default: "" },
    dob: { type: Date },
    gender: { type: String },
    address: {
      city: { type: String },
      state: { type: String },
      street: { type: String },
    },
    password: { type: String, required: true },
    ward: { type: String, default: "General" },
    role: { type: String, default: "nurse" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { strict: false }
);

const getNurseModel = () =>
  mongoose.models["Nurse"] ?? model<INurse>("Nurse", NurseSchema, "nurses");

// ---------------------------------------------------------------------------
// Core migration logic
// ---------------------------------------------------------------------------

async function migrateDoctors(
  session: ClientSession,
  dryRun: boolean,
  result: MigrationResult
): Promise<void> {
  const Doctor = getDoctorModel();
  const User = getUserModel();

  const doctors = await Doctor.find({}).session(session).lean();

  for (const doctor of doctors) {
    const doc = doctor as IDoctor & { _id: Types.ObjectId };

    // Idempotency: skip if userId already set
    if (doc.userId) {
      result.skipped++;
      console.log(`[SKIP] Doctor ${doc.email} already has userId`);
      continue;
    }

    // Check if a User record already exists for this email
    const existing = await User.findOne({ email: doc.email }).session(session).lean();
    if (existing) {
      // Write userId back even if User already existed (partial previous run)
      if (!dryRun) {
        await Doctor.updateOne(
          { _id: doc._id },
          { $set: { userId: (existing as IUser & { _id: Types.ObjectId })._id } },
          { session }
        );
      }
      result.skipped++;
      console.log(`[SKIP] User already exists for doctor ${doc.email}`);
      continue;
    }

    console.log(
      `[${dryRun ? "DRY-RUN" : "MIGRATE"}] Doctor → User: ${doc.email}`
    );

    if (!dryRun) {
      const [newUser] = await User.create(
        [
          {
            userName: doc.name,
            email: doc.email,
            password: doc.password, // already hashed in source
            role: "doctor",
            phoneNumber: doc.phoneno ?? "",
            dateOfBirth: doc.dob,
            gender: doc.gender ?? "",
            address: {
              street: doc.address?.street ?? "",
              city: doc.address?.city ?? "",
              state: doc.address?.state ?? "",
              zipCode: doc.address?.zipCode || "",
            },
          },
        ],
        { session }
      );

      await Doctor.updateOne(
        { _id: doc._id },
        { $set: { userId: newUser._id } },
        { session }
      );
    }

    result.doctorsMigrated++;
  }

  // Remove password and role fields from all doctor documents
  if (!dryRun) {
    await Doctor.updateMany(
      {},
      { $unset: { password: "", role: "" } },
      { session }
    );
  } else {
    const doctorCount = await Doctor.countDocuments({}, { session });
    console.log(
      `[DRY-RUN] Would remove password/role fields from ${doctorCount} doctor documents`
    );
  }
}

async function migrateNurses(
  session: ClientSession,
  dryRun: boolean,
  result: MigrationResult
): Promise<void> {
  const Nurse = getNurseModel();
  const User = getUserModel();

  const nurses = await Nurse.find({}).session(session).lean();

  for (const nurse of nurses) {
    const doc = nurse as INurse & { _id: Types.ObjectId };

    // Idempotency: skip if userId already set
    if (doc.userId) {
      result.skipped++;
      console.log(`[SKIP] Nurse ${doc.email} already has userId`);
      continue;
    }

    // Check if a User record already exists for this email
    const existing = await User.findOne({ email: doc.email }).session(session).lean();
    if (existing) {
      if (!dryRun) {
        await Nurse.updateOne(
          { _id: doc._id },
          { $set: { userId: (existing as IUser & { _id: Types.ObjectId })._id } },
          { session }
        );
      }
      result.skipped++;
      console.log(`[SKIP] User already exists for nurse ${doc.email}`);
      continue;
    }

    console.log(
      `[${dryRun ? "DRY-RUN" : "MIGRATE"}] Nurse → User: ${doc.email}`
    );

    if (!dryRun) {
      const [newUser] = await User.create(
        [
          {
            userName: doc.name,
            email: doc.email,
            password: doc.password, // already hashed in source
            role: "nurse",
            phoneNumber: doc.phoneno ?? "",
            dateOfBirth: doc.dob,
            gender: doc.gender ?? "",
            address: {
              street: doc.address?.street ?? "",
              city: doc.address?.city ?? "",
              state: doc.address?.state ?? "",
              zipCode: doc.address?.zipCode || "",
            },
          },
        ],
        { session }
      );

      await Nurse.updateOne(
        { _id: doc._id },
        { $set: { userId: newUser._id } },
        { session }
      );
    }

    result.nursesMigrated++;
  }

  // Remove password and role fields from all nurse documents
  if (!dryRun) {
    await Nurse.updateMany(
      {},
      { $unset: { password: "", role: "" } },
      { session }
    );
  } else {
    const nurseCount = await Nurse.countDocuments({}, { session });
    console.log(
      `[DRY-RUN] Would remove password/role fields from ${nurseCount} nurse documents`
    );
  }
}

// ---------------------------------------------------------------------------
// Exported entry point
// ---------------------------------------------------------------------------

export async function runMigration(
  mongoUri: string,
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const { dryRun = false } = options;

  const result: MigrationResult = {
    doctorsMigrated: 0,
    nursesMigrated: 0,
    skipped: 0,
    errors: [],
  };

  let connection: mongoose.Connection | null = null;

  try {
    await mongoose.connect(mongoUri);
    connection = mongoose.connection;

    if (dryRun) {
      console.log("=== DRY-RUN MODE — no changes will be persisted ===");
    }

    const session: ClientSession = await connection.startSession();

    try {
      await session.withTransaction(async () => {
        await migrateDoctors(session, dryRun, result);
        await migrateNurses(session, dryRun, result);
      });
    } finally {
      await session.endSession();
    }

    console.log("\n=== Migration complete ===");
    console.log(`  Doctors migrated : ${result.doctorsMigrated}`);
    console.log(`  Nurses migrated  : ${result.nursesMigrated}`);
    console.log(`  Skipped          : ${result.skipped}`);
    if (result.errors.length) {
      console.error(`  Errors           : ${result.errors.join(", ")}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Migration failed:", message);
    result.errors.push(message);
  } finally {
    if (connection) {
      await mongoose.disconnect();
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const uriIndex = args.indexOf("--mongo-uri");
  const mongoUri =
    uriIndex !== -1 && args[uriIndex + 1]
      ? args[uriIndex + 1]
      : process.env.MONGO_URI ?? "";

  if (!mongoUri) {
    console.error(
      "Error: MongoDB URI required. Pass --mongo-uri <uri> or set MONGO_URI env var."
    );
    process.exit(1);
  }

  runMigration(mongoUri, { dryRun })
    .then((res) => {
      process.exit(res.errors.length > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

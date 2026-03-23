import { Types } from 'mongoose';
import { Appointment } from '../../models/Appointment';
import { Invoice } from '../../models/Invoice';
import { LabOrder } from '../../models/LabOrder';
import { Prescription } from '../../models/Prescription';

export type Period = 'day' | 'week' | 'month';

function periodGroupId(period: Period, dateField: string): unknown {
  if (period === 'week') {
    // MongoDB doesn't support %W in $dateToString; compute YYYY-Www using isoWeek
    return {
      $concat: [
        { $toString: { $isoWeekYear: `$${dateField}` } },
        '-W',
        {
          $cond: {
            if: { $gte: [{ $isoWeek: `$${dateField}` }, 10] },
            then: { $toString: { $isoWeek: `$${dateField}` } },
            else: { $concat: ['0', { $toString: { $isoWeek: `$${dateField}` } }] },
          },
        },
      ],
    };
  }
  const format = period === 'day' ? '%Y-%m-%d' : '%Y-%m';
  return { $dateToString: { format, date: `$${dateField}` } };
}

export async function getAppointmentAnalytics(period: Period, doctorId?: string) {
  const matchStage: Record<string, unknown> = {};
  if (doctorId) {
    matchStage.doctor = new Types.ObjectId(doctorId);
  }

  const groupId = periodGroupId(period, 'date');

  const [volumeByPeriod, byStatus, byDoctor] = await Promise.all([
    Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupId,
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ]),

    Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$doctor',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctorProfile',
        },
      },
      { $unwind: { path: '$doctorProfile', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'users',
          localField: 'doctorProfile.userId',
          foreignField: '_id',
          as: 'userProfile',
        },
      },
      { $unwind: { path: '$userProfile', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id: 1,
          count: 1,
          doctorName: {
            $concat: ['$userProfile.firstName', ' ', '$userProfile.lastName'],
          },
        },
      },
    ]),
  ]);

  return { volumeByPeriod, byStatus, byDoctor };
}

export async function getRevenueAnalytics() {
  const [byMonth, outstandingResult, paymentMethods] = await Promise.all([
    Invoice.aggregate([
      { $match: { status: { $in: ['paid', 'partial'] } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: { $ifNull: ['$issuedDate', '$createdAt'] },
            },
          },
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ]),

    Invoice.aggregate([
      { $match: { status: { $in: ['issued', 'partial'] } } },
      {
        $group: {
          _id: null,
          outstanding: { $sum: '$balance' },
        },
      },
    ]),

    Invoice.aggregate([
      { $unwind: '$payments' },
      {
        $group: {
          _id: '$payments.method',
          amount: { $sum: '$payments.amount' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const outstanding = outstandingResult[0]?.outstanding ?? 0;

  return { byMonth, outstanding, paymentMethods };
}

export async function getLabAnalytics() {
  const [byPriority, byStatus, recentVolume] = await Promise.all([
    LabOrder.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),

    LabOrder.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    LabOrder.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$orderedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ]),
  ]);

  return { byPriority, byStatus, recentVolume };
}

export async function getPrescriptionAnalytics() {
  const [byStatus, topDrugs] = await Promise.all([
    Prescription.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    Prescription.aggregate([
      { $unwind: '$lineItems' },
      {
        $group: {
          _id: '$lineItems.drugName',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  // Compute fill rate: dispensed / (active + dispensed)
  const statusMap: Record<string, number> = {};
  for (const s of byStatus) {
    statusMap[s._id] = s.count;
  }
  const dispensed = statusMap['dispensed'] ?? 0;
  const active = statusMap['active'] ?? 0;
  const denominator = dispensed + active;
  const fillRate = denominator > 0 ? dispensed / denominator : 0;

  return { byStatus, fillRate, topDrugs };
}

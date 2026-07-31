import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComment {
  _id?: Types.ObjectId;
  text: string;
  authorName: string;
  authorRole: string;
  createdAt: Date;
}

export interface ITicket extends Document {
  ticketId: string;
  stationId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  status: 'Pending' | 'In-Progress' | 'Pending Review' | 'Resolved';
  resolutionToken?: string;
  s3ImageUrl?: string;
  telemetryIssueType?: string;
  remoteSoftware?: string;
  remoteId?: string;
  remotePassword?: string;
  fieldEngineerLocation?: {
    type: 'Point';
    coordinates: number[];
  };
  notes?: string;
  contactEmail?: string;
  comments: IComment[];
}

const ticketSchema = new Schema<ITicket>(
  {
    ticketId: {
      type: String,
      unique: true,
      index: true,
    },
    stationId: {
      type: Schema.Types.ObjectId,
      ref: 'Station',
      required: true,
      index: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In-Progress', 'Pending Review', 'Resolved'],
      default: 'Pending',
    },
    resolutionToken: {
      type: String,
      default: null,
      select: false, // Don't return it in default queries for security
    },
    s3ImageUrl: {
      type: String,
      default: null,
    },
    telemetryIssueType: {
      type: String,
    },
    remoteSoftware: {
      type: String,
      default: 'None',
    },
    remoteId: {
      type: String,
      default: '',
    },
    remotePassword: {
      type: String,
      default: '',
    },
    fieldEngineerLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },
    notes: {
      type: String,
    },
    contactEmail: {
      type: String,
    },
    comments: [
      {
        text: { type: String, required: true },
        authorName: { type: String, required: true },
        authorRole: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
  }
);

ticketSchema.pre('save', async function () {
  if (!this.isNew) {
    return;
  }

  const currentYear = new Date().getFullYear();
  const prefix = `SN-${currentYear}-`;

  // Find the highest ticket ID for the current year
  const lastTicket = await mongoose.model<ITicket>('Ticket').findOne(
    { ticketId: new RegExp(`^${prefix}`) },
    { ticketId: 1 },
    { sort: { ticketId: -1 } }
  );

  let nextNumber = 1001;
  if (lastTicket && lastTicket.ticketId) {
    const lastNumberMatch = lastTicket.ticketId.match(/-(\d+)$/);
    if (lastNumberMatch && lastNumberMatch[1]) {
      nextNumber = parseInt(lastNumberMatch[1], 10) + 1;
    }
  }

  this.ticketId = `${prefix}${nextNumber}`;
});

ticketSchema.index({ fieldEngineerLocation: '2dsphere' });
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ creatorId: 1 });
ticketSchema.index({ assignedTo: 1 });

const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);
export default Ticket;

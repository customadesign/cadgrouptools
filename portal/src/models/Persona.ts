import { Schema, model, models } from 'mongoose';

const PersonaSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      enum: ['murphy', 'esystems'],
      index: true,
    },
    promptText: {
      type: String,
      required: true,
      minlength: 50,
    },
    ghlFormId: {
      type: String,
      required: true,
      index: true,
    },
    ghlFormName: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
PersonaSchema.index({ company: 1, ghlFormId: 1 });
PersonaSchema.index({ ghlFormId: 1, isActive: 1 });

// Only one active persona per form
PersonaSchema.pre('save', async function(next) {
  if (this.isActive && this.isModified('isActive')) {
    // Deactivate other personas for the same form
    await (this.constructor as any).updateMany(
      {
        ghlFormId: this.ghlFormId,
        _id: { $ne: this._id },
      },
      { isActive: false }
    );
  }
  next();
});

const Persona = models.Persona || model('Persona', PersonaSchema);

export default Persona;


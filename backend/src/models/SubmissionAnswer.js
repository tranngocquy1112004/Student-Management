import mongoose from 'mongoose';

const submissionAnswerSchema = new mongoose.Schema({
  submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: false },
  isCorrect: { type: Boolean, required: true },
}, { timestamps: true });

submissionAnswerSchema.index({ submissionId: 1, questionId: 1 }, { unique: true });

export default mongoose.model('SubmissionAnswer', submissionAnswerSchema);


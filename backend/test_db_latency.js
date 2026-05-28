const mongoose = require('mongoose');
const PersonalFinance = require('./src/models/personalFinance.model');
const User = require('./src/models/User');

require('dotenv').config();

async function testLatency() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/finix';
  console.log('Connecting to', MONGO_URI);
  
  const startConn = Date.now();
  await mongoose.connect(MONGO_URI);
  console.log(`Connected in ${Date.now() - startConn}ms`);

  const fakeUserId = new mongoose.Types.ObjectId();

  const startSave = Date.now();
  const tx = new PersonalFinance({
      userId: fakeUserId,
      tipo: 'ingreso',
      monto: 25000,
      categoria: 'salario',
      descripcion: 'Test latency',
      createdBy: fakeUserId
  });
  await tx.save();
  console.log(`Save took ${Date.now() - startSave}ms`);

  const startFind = Date.now();
  await PersonalFinance.find({ userId: fakeUserId }).limit(10).lean();
  console.log(`Find took ${Date.now() - startFind}ms`);

  const startCount = Date.now();
  await PersonalFinance.countDocuments({ userId: fakeUserId });
  console.log(`Count took ${Date.now() - startCount}ms`);

  await PersonalFinance.deleteOne({ _id: tx._id });
  mongoose.connection.close();
}

testLatency();

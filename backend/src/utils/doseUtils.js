const Dose = require('../models/Dose');
const deleteDosesForMedication=async(medicationId)=>{
    await Dose.deleteMany({medicationId});
}
module.exports={
    deleteDosesForMedication
}
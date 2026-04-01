import React from 'react';
import { useParams } from 'react-router-dom';
import MedicationForm from '../components/medications/MedicationForm';
import PageDoodle from '../components/common/PageDoodle';

const EditMedication = () => {
    const { id } = useParams();
    
    return (
        <div>
            <div className="mb-4 flex justify-end">
                <PageDoodle type="medication" className="hidden md:block" />
            </div>
            <MedicationForm isEditing={true} medicationId={id} />
        </div>
    );
};

export default EditMedication;

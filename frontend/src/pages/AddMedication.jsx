import React from 'react';
import MedicationForm from '../components/medications/MedicationForm';
import { useTheme } from '../context/ThemeContext';
import DarkModeSwitch from '../components/common/DarkModeSwitch';
import PageDoodle from '../components/common/PageDoodle';

const AddMedication = () => {
    return (
        <div>
            <div className="mb-4 flex justify-end">
                <PageDoodle type="medication" className="hidden md:block" />
            </div>
            <MedicationForm isEditing={false} />
        </div>
    );
};

export default AddMedication;

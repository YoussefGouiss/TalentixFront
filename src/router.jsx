import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import WelcomPage from './Admin/pages/welcom';
import AdminLogin from './Admin/pages/auth/Adminlogin';
import MainLayoute from './Admin/layoute/main';
import DashbordAdmin from './Admin/pages/Dashbord/DashbordAdmin';
import Employee from './Admin/pages/employe/Employe';
import EProductOrdersPage from './Admin/pages/test';
import Conges from './Admin/pages/conges/Conges';
import Absences from './Admin/pages/employe/presences/Absences';
import PrivateRoute from './Admin/PrivateRoute';
import EmployeeLogin from './Employe/pages/auth/Employeelogin';
import ProRoute from './Employe/ProRoute';
import MainLayouteEmploye from './Employe/pages/Layout/main';
import DashboardEmploye from './Employe/pages/dashboard/DashboardEmploye';
import MaterialEmploye from './Employe/pages/material/Material';
import MaterialAdmin from './Admin/pages/materialadmi/MaterialAdmin';
import FormationAdmin from './Admin/pages/formation/FormationAdmin';
import DemandeFormation from './Admin/pages/formation/DemandeFormation';
import EmployeFormations from './Employe/formations/EmployeFormation';
import FichesPaieAdmin from './Admin/pages/FichePaie/FichePaieAdmin';
import AbsencesAdmin from './Admin/pages/Abscence/AbsenceAdmin';
import Recrutement from './Admin/pages/Recrutement/Recrutement';
import DemandeCondidateur from './Admin/pages/Recrutement/DemandeCondidateur';
import AttestationTypeManagement from './Admin/pages/Attestation/AttestationTypeManagement';
import AttestationDemandeList from './Admin/pages/Attestation/DemandesDesAttestations';
import EmployeDemandeAttestation from './Employe/pages/attestation/EmployeDemandeAttestation';
import Conge from './Employe/pages/conges/Conge';
import AbsenceAdmin from './Admin/pages/Abscence/AbsenceAdmin';
import AbsenceEmploye from './Employe/pages/absences/AbsenceEmploye';
import WelcomPageTest from './WelcomPage';
import PrimesAdmin from './Admin/pages/prime/Prime';
import EmployePrimes from './Employe/pages/absences/primes/Primes';
import EmployeRemboursements from './Employe/pages/remboursement/Remboursement';
import AdminRemboursementList from './Admin/pages/rembourcement/Rembourcement';
 const route = createBrowserRouter([
        {
            path :'/',
            element : <WelcomPageTest/>
        },
        {
            path :'/admin/login',
            element : <AdminLogin/>
        },
        {
            path :'/employe/login',
            element : <EmployeeLogin/>
        },
        {
            path :'/test',
            element : <EProductOrdersPage/>
        },
        {
            path : 'admin',
            element :(<PrivateRoute><MainLayoute/></PrivateRoute> ),
            children :[
                {
                    index : true,
                    element  : <DashbordAdmin/>
                },
                {
                    path : 'employes',
                    element : <Employee/>
                },
                {
                    path : 'conges',
                    element : <Conges/>
                },
                {
                    path : 'Absences',
                    element : <AbsenceAdmin/>
                },
                {
                    path : 'material',
                    element : <MaterialAdmin/>
                },
                {
                    path : 'formation',
                    element : <FormationAdmin/>
                },
                {
                    path : 'demandes-formations',
                    element : <DemandeFormation/>
                },
                 {

                    path : 'FichePaie',
                    element : <FichesPaieAdmin/>
                },
                {
                    path : 'recrutements',
                    element : <Recrutement/>
                },
                 {
                    path : 'candidateur',
                    element : <DemandeCondidateur/>
                },
                 {
                    path : 'attestations',
                    element : <AttestationTypeManagement/>
                },
                {
                    path : 'demandeAttestation',
                    element : <AttestationDemandeList/>
                },
                {
                    path : 'primes',
                    element : <PrimesAdmin/>
                },
                 {
                    path : 'remboursements',
                    element : <AdminRemboursementList/>
                },
               
               
                
            ],
        },
        {
            path : 'employe',
            element :(<ProRoute><MainLayouteEmploye/></ProRoute> ),
            children :[
                {
                    index : true,
                    element  : <DashboardEmploye/>
                },
                {
                    path : 'material',
                    element  : <MaterialEmploye/>
                },
                {
                    path : 'formations',
                    element  : <EmployeFormations/>
                },
                {
                    path : 'attestations',
                    element  : <EmployeDemandeAttestation/>
                },
                {
                    path : 'conges',
                    element  : <Conge/>
                },
                {
                    path : 'absences',
                    element  : <AbsenceEmploye/>
                },
                {
                    path : 'primes',
                    element  : <EmployePrimes/>
                },
                {
                    path : 'remboursements',
                    element  : <EmployeRemboursements/>
                },
            ]
        }

        
    ])
 export default route;




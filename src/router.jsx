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
import Recrutement from './Admin/pages/Recrutement/Recrutement';
import DemandeCondidateur from './Admin/pages/Recrutement/DemandeCondidateur';
 const route = createBrowserRouter([
        {
            path :'/',
            element : <WelcomPage/>
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
                    element : <Absences/>
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
                    path : 'recrutements',
                    element : <Recrutement/>
                },
                 {
                    path : 'candidateur',
                    element : <DemandeCondidateur/>
                },

            ]
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
            ]
        }

        
    ])
 export default route;




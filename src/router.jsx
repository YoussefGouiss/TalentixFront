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
            ]
        }

        
    ])
 export default route;




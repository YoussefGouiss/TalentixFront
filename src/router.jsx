import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import WelcomPage from './Admin/pages/welcom';
import AdminLogin from './Admin/pages/auth/Adminlogin';
import EmployeeLogin from './Admin/pages/auth/Employeelogin';
import MainLayoute from './Admin/layoute/main';
import DashbordAdmin from './Admin/pages/Dashbord/DashbordAdmin';
import Employee from './Admin/pages/employe/Employe';
import EProductOrdersPage from './Admin/pages/test';
import Conges from './Admin/pages/conges/Conges';
import Presences from './Admin/pages/presences/Presences';
 const route = createBrowserRouter([
        {
            path :'/',
            element : <WelcomPage/>
        },
        {
            path :'/adminlogin',
            element : <AdminLogin/>
        },
        {
            path :'/employeelogin',
            element : <EmployeeLogin/>
        },
        {
            path :'/test',
            element : <EProductOrdersPage/>
        },
        {
            path : 'admin',
            element : <MainLayoute/>,
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
                    path : 'presences',
                    element : <Presences/>
                },
            ]
        }

        
    ])
 export default route;




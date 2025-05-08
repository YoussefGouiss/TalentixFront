import { useState } from 'react';
import { ChevronRight, Sparkles, Info, Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WelcomPage() {
  const [hoveredCard, setHoveredCard] = useState(null);
  
  return (
    <div className="min-h-screen w-full bg-[#253344] flex flex-col items-center justify-center p-6 relative overflow-x-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-40 h-40 bg-[#3498db]/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-20 w-64 h-64 bg-[#3498db]/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-[#3498db]/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-[#3498db]/5 rounded-full blur-xl"></div>
      </div>
      
      {/* Decorative grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.slate.700/10)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.700/10)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      
      {/* Main Content */}
      <div className="relative z-10 bg-[#1e2b3a]/80 backdrop-blur-md p-10 rounded-2xl border border-[#344454]/50 shadow-2xl w-full max-w-6xl mx-auto">
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#3498db] rounded-full p-3 shadow-lg shadow-[#3498db]/30">
          <Info size={28} className="text-white" />
        </div>
        
        {/* Heading with enhanced styling */}
        <div className="text-center mb-16 mt-4">
          <div className="flex items-center justify-center mb-3">
            <Sparkles className="text-[#3498db] mr-3" size={28} />
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#3498db] to-[#47b4e0]">
              Sélectionnez votre rôle
            </h1>
            <Sparkles className="text-[#3498db] ml-3" size={28} />
          </div>
          <div className="w-32 h-1 mx-auto bg-gradient-to-r from-[#3498db] to-[#47b4e0] rounded-full mt-4"></div>
        </div>
        
        {/* Cards container */}
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl mx-auto">
          {/* Employee Card */}
          <div 
            className={`relative group flex-1 bg-gradient-to-br from-[#1e2b3a]/90 to-[#253344]/90 p-1.5 rounded-2xl backdrop-blur-sm transition-all duration-300 ${hoveredCard === 'employee' ? 'scale-105' : ''}`}
            onMouseEnter={() => setHoveredCard('employee')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Glowing border */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3498db] to-[#47b4e0] rounded-2xl opacity-20 group-hover:opacity-50 transition-opacity"></div>
            
            <div className="relative bg-[#1e2b3a]/70 p-6 rounded-xl h-full flex flex-col items-center justify-center backdrop-blur-sm border border-[#344454]/50">
              <img 
                src="/boy1-removebg-preview (1).png"
                alt="Employee" 
                className="w-full h-full object-cover rounded-md"
              />
               <Link to='/employe/login'>
              <button className="mt-8 w-full py-4 px-6 bg-gradient-to-r from-[#3498db] to-[#47b4e0] hover:from-[#47b4e0] hover:to-[#3498db] text-white font-medium text-lg rounded-xl flex items-center justify-center group transition-all shadow-xl shadow-[#3498db]/20">
                <span className="relative z-10 flex items-center">
                Je suis un employée
                  <ChevronRight className="ml-2 w-6 h-6 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
              </Link> 
            </div>
          </div>
          
          {/* Admin Card */}
          <div 
            className={`relative group flex-1 bg-gradient-to-br from-[#1e2b3a]/90 to-[#253344]/90 p-1.5 rounded-2xl backdrop-blur-sm transition-all duration-300 ${hoveredCard === 'admin' ? 'scale-105' : ''}`}
            onMouseEnter={() => setHoveredCard('admin')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Glowing border */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3498db] to-[#47b4e0] rounded-2xl opacity-20 group-hover:opacity-50 transition-opacity"></div>
            
            <div className="relative bg-[#1e2b3a]/70 p-8 rounded-xl h-full flex flex-col items-center backdrop-blur-sm border border-[#344454]/50">
              <img 
                src="/imgf.png"
                alt="Admin" 
                className="w-full h-full object-cover rounded-md"
              />
              <Link to='/admin/login'>
              <button className="mt-8 w-full py-4 px-6 bg-gradient-to-r from-[#3498db] to-[#47b4e0] hover:from-[#47b4e0] hover:to-[#3498db] text-white font-medium text-lg rounded-xl flex items-center justify-center group transition-all shadow-xl shadow-[#3498db]/20">
                <span className="relative z-10 flex items-center">
                 Je suis un admin
                  <ChevronRight className="ml-2 w-6 h-6 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Footer with social icons */}
        <div className="flex justify-center mt-12 space-x-6">
          <a href="#" className="text-[#8aa0b4] hover:text-[#3498db] transition-colors">
            <Facebook size={24} />
          </a>
          <a href="#" className="text-[#8aa0b4] hover:text-[#3498db] transition-colors">
            <Instagram size={24} />
          </a>
          <a href="#" className="text-[#8aa0b4] hover:text-[#3498db] transition-colors">
            <Twitter size={24} />
          </a>
        </div>
      </div>
      
      {/* CSS for hexagon shapes */}
      <style jsx>{`
        .hexagon-container {
          width: 260px;
          height: 260px;
          position: relative;
        }
        
        .hexagon {
          position: relative;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #3498db 0%, #47b4e0 100%);
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        
        .hexagon:before {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          right: 3px;
          bottom: 3px;
          background: linear-gradient(135deg, #1e2b3a 0%, #253344 100%);
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          z-index: 1;
        }
        
        .hexagon img {
          position: relative;
          z-index: 2;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseWorksheetData, parseWorksheetHeader } from '../components/WorksheetParser';
import '../styles/Results.css';

interface DepartmentCardProps {
  department: {
    deptNumber: string;
    deptName: string;
    subDepartments: Array<{
      subDeptNumber: string;
      subDeptName: string;
      items: Array<{
        sku: string;
        description: string;
        quantity: number;
        icons: string[];
        cartonQty: number;
      }>;
    }>;
    isExpanded: boolean;
  };
}

const SubDepartmentSection: React.FC<{
  subDepartment: DepartmentCardProps['department']['subDepartments'][0];
  isParentExpanded: boolean;
  initialExpanded: boolean;
}> = ({ subDepartment, isParentExpanded, initialExpanded }) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  // Update expansion state when parent toggles
  useEffect(() => {
    if (!isParentExpanded) {
      setIsExpanded(false);
    } else if (initialExpanded) {
      setIsExpanded(true);
    }
  }, [isParentExpanded, initialExpanded]);

  return (
    <div className="subdepartment-section">
      <div 
        className="subdepartment-header"
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering parent's click
          setIsExpanded(!isExpanded);
        }}
      >
        <h3>SUB DEPT {subDepartment.subDeptNumber} - {subDepartment.subDeptName}</h3>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </div>
      
      {isExpanded && (
        <div className="items-list">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Description</th>
                <th>Icons</th>
                <th>Quantity</th>
                <th>Carton Qty</th>
              </tr>
            </thead>
            <tbody>
              {subDepartment.items.map((item) => (
                <tr key={item.sku}>
                  <td>{item.sku}</td>
                  <td>{item.description}</td>
                  <td>{item.icons.join(' ')}</td>
                  <td>{item.quantity}</td>
                  <td>{item.cartonQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const DepartmentCard: React.FC<DepartmentCardProps> = ({ department }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [initialSubDeptExpansion, setInitialSubDeptExpansion] = useState(false);

  const toggleDepartment = () => {
    if (!isExpanded) {
      // When expanding, set initial state for subdepartments
      setInitialSubDeptExpansion(true);
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="department-card">
      <div 
        className="department-header" 
        onClick={toggleDepartment}
      >
        <h2>DEPT {department.deptNumber} - {department.deptName}</h2>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </div>
      
      {isExpanded && department.subDepartments.map((subDept) => (
        <SubDepartmentSection 
          key={subDept.subDeptNumber} 
          subDepartment={subDept}
          isParentExpanded={isExpanded}
          initialExpanded={initialSubDeptExpansion}
        />
      ))}
    </div>
  );
};

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<ReturnType<typeof parseWorksheetData>>([]);
  const [headerInfo, setHeaderInfo] = useState<ReturnType<typeof parseWorksheetHeader> | null>(null);

  useEffect(() => {
    const worksheetText = location.state?.worksheetText;
    if (!worksheetText) {
      navigate('/');
      return;
    }

    const parsedDepartments = parseWorksheetData(worksheetText);
    const parsedHeader = parseWorksheetHeader(worksheetText);
    setDepartments(parsedDepartments);
    setHeaderInfo(parsedHeader);
  }, [location.state, navigate]);

  if (!headerInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="results-container">
      <div className="header-info">
        <h1>Store Order Worksheet</h1>
        <div className="header-details">
          <p>Store: {headerInfo.storeNumber} - {headerInfo.location}</p>
          <p>Order: {headerInfo.orderNumber}</p>
          <p>DC: {headerInfo.dcNumber} - {headerInfo.dcName}</p>
          <p>Date: {headerInfo.date} Time: {headerInfo.time}</p>
        </div>
      </div>
      
      <div className="departments-grid">
        {departments.map((dept, index) => (
          <DepartmentCard 
            key={`${dept.deptNumber}-${index}`} 
            department={dept} 
          />
        ))}
      </div>
    </div>
  );
}

export default Results; 
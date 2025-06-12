interface WorksheetItem {
    sku: string;
    description: string;
    quantity: number;
    icons: string[];
    cartonQty: number;
}

interface SubDepartment {
    subDeptNumber: string;
    subDeptName: string;
    items: WorksheetItem[];
}

interface WorksheetDepartment {
    deptNumber: string;
    deptName: string;
    subDepartments: SubDepartment[];
    isExpanded: boolean;
}

export const parseWorksheetData = (worksheetText: string): WorksheetDepartment[] => {
    const departmentMap = new Map<string, WorksheetDepartment>();
    let currentDepartment: WorksheetDepartment | null = null;
    let currentSubDepartment: SubDepartment | null = null;
    let totalCases = 0;
    
    // Split the worksheet into lines and process each line
    const lines = worksheetText.split('\n');
    
    console.log('Total lines to process:', lines.length);
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines or header/footer lines
        if (!trimmedLine || 
            trimmedLine.includes('----') || 
            trimmedLine.includes('Page:') || 
            trimmedLine.includes('="') ||
            trimmedLine.includes('MERCHANDISE SKUs') ||
            trimmedLine.includes('Store Number:') ||
            trimmedLine.includes('Merch Code') ||
            trimmedLine.includes('Sku/Description') ||
            trimmedLine.includes('under 14 days supply') ||
            trimmedLine.includes('OPR241')) {
            continue;
        }

        // Check for department header
        if (trimmedLine.startsWith('Dept:')) {
            console.log('Potential department line:', trimmedLine);
            const deptMatch = trimmedLine.match(/Dept:\s*(\d{3})\s+([^]*?)Sub-Dept:\s*(\d{3})\s+([^]*)/);
            if (deptMatch) {
                const [_, deptNum, deptName, subDeptNum, subDeptName] = deptMatch;
                
                // Get or create department
                if (!departmentMap.has(deptNum)) {
                    currentDepartment = {
                        deptNumber: deptNum,
                        deptName: deptName.trim(),
                        subDepartments: [],
                        isExpanded: false
                    };
                    departmentMap.set(deptNum, currentDepartment);
                } else {
                    currentDepartment = departmentMap.get(deptNum)!;
                }

                // Create new subdepartment
                currentSubDepartment = {
                    subDeptNumber: subDeptNum,
                    subDeptName: subDeptName.trim(),
                    items: []
                };

                // Only add if this subdepartment number doesn't exist yet
                if (!currentDepartment.subDepartments.some(sd => sd.subDeptNumber === subDeptNum)) {
                    currentDepartment.subDepartments.push(currentSubDepartment);
                } else {
                    // Find existing subdepartment to add items to
                    currentSubDepartment = currentDepartment.subDepartments.find(
                        sd => sd.subDeptNumber === subDeptNum
                    )!;
                }
            }
            continue;
        }
        
        // Check for item line
        if (currentDepartment && currentSubDepartment && trimmedLine) {
            const itemMatch = trimmedLine.match(/^(\d{3,6})\s+(.+?)(?:\s+([UMTPRO](?:\s+[UMTPRO])*)?)?\s+(\d{1,3})\s+(\d{1,4})(?:\s+(?:SZ|DO|[A-Z]{2}(?:\s+[A-Z]{2})*)?)?\s*(?:_{2,}|")?$/);
            
            if (itemMatch) {
                const icons = (itemMatch[3] || '').split(/\s+/).filter(char => 'UMTPRO'.includes(char));
                const quantity = parseInt(itemMatch[4]);
                const sku = itemMatch[1].padStart(6, '0');
                
                const item: WorksheetItem = {
                    sku: sku,
                    description: itemMatch[2].trim(),
                    icons: icons,
                    quantity: quantity,
                    cartonQty: parseInt(itemMatch[5])
                };
                
                currentSubDepartment.items.push(item);
                totalCases += quantity;
                console.log('Parsed item:', item);
            } else if (trimmedLine.match(/^\d{6}/)) {
                console.log('Unmatched item line:', trimmedLine);
            }
        }
    }

    // Convert map to array and sort departments
    const departments = Array.from(departmentMap.values());
    
    // Sort departments by number
    departments.sort((a, b) => a.deptNumber.localeCompare(b.deptNumber));
    
    // Sort subdepartments within each department
    departments.forEach(dept => {
        dept.subDepartments.sort((a, b) => a.subDeptNumber.localeCompare(b.subDeptNumber));
    });

    console.log('Total departments found:', departments.length);
    console.log('Total cases parsed:', totalCases);
    return departments;
};

export const parseWorksheetHeader = (worksheetText: string) => {
    const lines = worksheetText.split('\n');
    const headerInfo = {
        storeNumber: '',
        location: '',
        orderNumber: '',
        dcNumber: '',
        dcName: '',
        date: '',
        time: ''
    };
    
    for (const line of lines) {
        if (line.includes('Store Number:')) {
            const match = line.match(/Store Number:\s*(\d+)\s+(.*?)Order Number:\s*(\d+)/);
            if (match) {
                headerInfo.storeNumber = match[1];
                headerInfo.location = match[2].trim();
                headerInfo.orderNumber = match[3];
            }
        } else if (line.includes('DC#:')) {
            const match = line.match(/DC#:\s*(\d+)\s+(.*)/);
            if (match) {
                headerInfo.dcNumber = match[1];
                headerInfo.dcName = match[2];
            }
        } else if (line.includes('Date:')) {
            const match = line.match(/Date:\s*([\d/]+)\s+.*Time:\s*([\d:]+)/);
            if (match) {
                headerInfo.date = match[1];
                headerInfo.time = match[2];
            }
        }
    }
    
    return headerInfo;
};
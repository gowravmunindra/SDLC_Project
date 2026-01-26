# IEEE PDF Import Feature

## Overview

Import existing IEEE 29148-2018 SRS PDFs and automatically extract all requirements into your SDLC platform.

---

## How It Works

### **Step 1: Upload PDF**
- Click **"📄 Import PDF"** button on Requirements Agent step 1
- Select your IEEE SRS PDF file
- The platform extracts text using pdf-parse library

### **Step 2: AI Processing**
- Extracted text is sent to AI (HuggingFace/Gemini)
- AI intelligently parses:
  - Project description/scope
  - Functional requirements with IDs, priorities
  - Non-functional requirements (categorized)
  - Stakeholders
  - Assumptions & constraints

### **Step 3: Auto-Population**
- All fields automatically populated
- Review screen appears with extracted data
- Edit, add, or remove anything
- Proceed to export or next phase

---

## Use Cases

✅ **Import Legacy Documentation**
- Migrate old IEEE SRS docs to the platform
- Modernize existing requirements

✅ **Team Collaboration**
- Team member creates SRS externally
- Import to platform for tracking

✅ **Client Deliverables**
- Client provides IEEE SRS
- Import to start development phase

✅ **Quick Start Projects**
- Reuse requirements from similar projects
- Modify and customize as needed

---

## Supported Formats

### ✅ **Best Results**
- IEEE 29148-2018 formatted PDFs
- Clear section headers (1., 2., 3.1, 3.2, etc.)
- Properly formatted requirement IDs (REQ-FR-001, FR-001, etc.)
- Standard sections: Introduction, Overall Description, Specific Requirements

### ⚠️ **May Work**
- IEEE 830-1998 (older standard)
- Similar structured SRS documents
- Documents with clear requirement sections

### ❌ **Won't Work**
- Scanned PDFs (images, not text)
- Heavily formatted/graphical PDFs
- Non-SRS documents
- Encrypted/password-protected PDFs

---

## Tips for Best Results

1. **Use Text-Based PDFs**
   - Generated from Word/LaTeX, not scanned

2. **Clear Structure**
   - Ensure section numbers are present (1., 2., 3.1, etc.)
   - Requirement IDs help AI identify requirements

3. **Standard Format**
   - Closer to IEEE standard = better extraction
   - Consistent formatting throughout

4. **Review After Import**
   - Always review extracted data
   - AI is smart but not perfect
   - Edit/add missing items

---

## Technical Details

### **Libraries Used**
- `pdf-parse` - PDF text extraction
- HuggingFace AI - Intelligent parsing
- Custom validation logic

### **AI Prompt**
The AI is prompted to extract:
```
- Project Description
- Functional Requirements (ID, title, description, priority, rationale)
- Non-Functional Requirements (categorized: performance, security, usability, scalability, reliability)
- Stakeholders (name, role, influence)
- Assumptions (description)
- Constraints (description)
```

### **Data Validation**
- Validates all arrays and objects
- Generates default IDs if missing
- Ensures editable=true for all items
- Falls back gracefully on errors

---

## Troubleshooting

### **Import Failed**
- **Cause**: PDF parsing error or AI timeout
- **Solution**: Try manual re-upload or manual entry

### **Missing Requirements**
- **Cause**: AI couldn't find certain sections
- **Solution**: Add manually after import

### **Wrong Categorization**
- **Cause**: AI misinterpreted requirement type
- **Solution**: Edit in review screen, move to correct category

### **Empty Fields**
- **Cause**: PDF structure too different from standard
- **Solution**: Use as starting point, fill in gaps manually

---

## Example Workflow

```
1. User has "Project_SRS_IEEE.pdf"
2. Clicks "Import PDF" → Selects file
3. Platform shows "Importing..." spinner
4. AI extracts 15 functional requirements, 8 NFRs, 3 stakeholders
5. Review screen appears with all data
6. User edits 2 requirements, adds 1 more
7. Clicks "Complete & Save"
8. Proceeds to Design Phase
```

---

## Future Enhancements

Planned improvements:
- [ ] Support for scanned PDFs (OCR)
- [ ] Batch import multiple PDFs
- [ ] Import from DOCX/Word documents
- [ ] Export comparison (original vs edited)
- [ ] Version tracking for imported docs

---

## Limitations

- First 15,000 characters of PDF used (AI token limit)
- Requires internet connection for AI processing
- Processing time: 5-15 seconds depending on PDF size
- AI accuracy: ~85-95% depending on PDF format

---

**Ready to import!** 📤📄✨

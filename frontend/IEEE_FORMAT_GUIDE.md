# IEEE 29148 Format Support

## Overview

The SDLC Platform now supports **dual-format requirements**:

1. **Simple Format** (UI) - Easy to work with, edit, and review
2. **IEEE 29148-2018** (Export) - Formal, compliant SRS documentation

---

## What is IEEE 29148-2018?

**IEEE 29148-2018** is the international standard for:
- Systems and software requirements engineering
- Life cycle processes for requirements
- Professional requirements documentation

It replaced the older **IEEE 830-1998** standard.

---

## Features

### ✅ **Simple Format (UI)**
- Easy-to-read cards and lists
- Quick editing and updates
- Interactive AI generation
- Visual organization

### ✅ **IEEE Format (Export)**
- Complete SRS document structure
- All required IEEE sections:
  - Introduction (Purpose, Scope, Conventions)
  - Overall Description (Perspective, Functions, Users)
  - Specific Requirements (Functional & Non-Functional)
  - Traceability Matrix
- Formal requirement IDs (REQ-FR-XXX-001)
- Acceptance criteria
- Rationale and dependencies
- Metrics for NFRs

---

## How to Use

### **Step 1: Generate Requirements (Simple Format)**

1. Open Requirements Agent
2. Enter project description
3. AI generates requirements in simple format
4. Review and edit in the UI

### **Step 2: Export IEEE Format**

1. Click **"📄 Export IEEE Format"** button
2. Downloads: `IEEE-29148-SRS.md`
3. Open in any markdown viewer or convert to PDF

### **Step 3: Review IEEE Document**

The exported document includes:

```markdown
# Software Requirements Specification (SRS)

**Standard:** IEEE 29148-2018
**Version:** 1.0
**Date:** [Current Date]
**Status:** Draft

## Table of Contents
1. Introduction
2. Overall Description
3. Specific Requirements
4. Traceability Matrix

[... complete IEEE-compliant structure ...]
```

---

## IEEE Requirements Format

### **Functional Requirement Example**

```
#### REQ-FR-SYS-001

**Description:** The system shall allow users to create an account with email and password

**Rationale:** Required for system functionality

**Priority:** High

**Acceptance Criteria:**
- Requirement is fully implemented
- All test cases pass
- Performance meets specified criteria

**Traceability:**
- Source: User Requirements
- Verification: Testing
- Validation: User Acceptance
```

### **Non-Functional Requirement Example**

```
#### REQ-NFR-PERF-001 - performance

**Description:** System must respond within 2 seconds for 95% of requests

**Metric:** Response time < 2 seconds for 95% of requests

**Priority:** High

**Acceptance Criteria:**
- Meets performance standards
- Verified through testing
- Documented and traceable
```

---

## Traceability Matrix

Every exported IEEE document includes a traceability matrix:

| Requirement ID | Type | Description | Source | Design | Implementation | Test | Status |
|----------------|------|-------------|--------|--------|----------------|------|--------|
| REQ-FR-SYS-001 | Functional | User account creation... | User Requirements | TBD | TBD | TBD | Defined |
| REQ-NFR-PERF-001 | Non-Functional | Response time < 2s... | Quality Requirements | TBD | TBD | TBD | Defined |

---

## Benefits

### **For Development Teams**
- ✅ Work with simple UI during daily tasks
- ✅ Export formal docs when needed
- ✅ Best of both worlds

### **For Documentation**
- ✅ Professional IEEE-compliant SRS
- ✅ Automatic traceability
- ✅ Ready for audits/reviews

### **For Academic Projects**
- ✅ Meets university requirements
- ✅ Shows professional standards
- ✅ Ready for submission

---

## File Format

- **Output:** Markdown (.md)
- **Can convert to:** PDF, DOCX using tools like Pandoc
- **Recommended viewer:** VS Code, Obsidian, or any markdown reader

### **Convert to PDF (Optional)**

```bash
# Using Pandoc (if installed)
pandoc IEEE-29148-SRS.md -o SRS.pdf

# Or use online converters
# - https://www.markdowntopdf.com/
# - https://dillinger.io/
```

---

## Technical Details

### **Implementation**

- **Converter:** `src/utils/ieeeFormatConverter.js`
- **Integration:** `src/components/RequirementsAgent.jsx`
- **Functions:**
  - `convertToIEEEFormat()` - Transforms data
  - `generateIEEEDocument()` - Creates markdown
  - `generateIEEERequirementId()` - Creates IDs

### **Structure**

```
Simple Requirements
        ↓
IEEE Format Converter
        ↓
IEEE SRS Document
        ↓
Markdown Download
```

---

## Future Enhancements

Planned features:
- [ ] PDF export (direct)
- [ ] DOCX export
- [ ] Custom templates
- [ ] Requirement versioning
- [ ] Change tracking
- [ ] Approval workflow

---

## References

- **IEEE 29148-2018:** Systems and software engineering — Life cycle processes — Requirements engineering
- **Previous Standard:** IEEE 830-1998 (superseded)
- **Related Standards:** ISO/IEC/IEEE 15288, ISO/IEC/IEEE 12207

---

## Support

For questions or issues with IEEE format:
1. Check the generated SRS document structure
2. Review IEEE 29148-2018 standard guidelines
3. Consult project documentation

**Happy documenting!** 📄🎯

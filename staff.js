// รายชื่อบุคลากรสำหรับเลือกผู้ตรวจ/ผู้อนุมัติ/ผู้ลงนาม
// role: 'head_dept'=หัวหน้าฝ่าย/กลุ่มสาระ, 'finance'=เจ้าหน้าที่การเงิน,
//       'saraban'=งานสารบรรณ/ธุรการ, 'director'=ผู้อำนวยการ, 'authorized'=ผู้ลงนามแทน/ผู้รับใบอนุญาต

const STAFF_LIST = [
  // ── ผู้บริหาร ──
  { name: 'ผู้อำนวยการโรงเรียน',         email: 'director@psuwitsurat.ac.th',  role: 'director'    },
  { name: 'ผู้ลงนามแทน (ผู้รับใบอนุญาต)', email: 'authorized@psuwitsurat.ac.th', role: 'authorized'  },

  // ── หัวหน้าฝ่าย ──
  { name: 'หัวหน้าฝ่ายวิชาการ',              email: 'academic_head@psuwitsurat.ac.th', role: 'head_dept' },
  { name: 'หัวหน้าฝ่ายพัฒนาผู้เรียน',       email: 'student_head@psuwitsurat.ac.th',  role: 'head_dept' },
  { name: 'หัวหน้าฝ่ายนโยบายและบริหาร',     email: 'policy_head@psuwitsurat.ac.th',   role: 'head_dept' },
  { name: 'หัวหน้าฝ่ายสารสนเทศและเทคโนโลยี', email: 'tech_head@psuwitsurat.ac.th',   role: 'head_dept' },
  { name: 'หัวหน้าฝ่ายบริการ',              email: 'service_head@psuwitsurat.ac.th',  role: 'head_dept' },

  // ── งานสารบรรณ/ธุรการ ──
  { name: 'เจ้าหน้าที่งานสารบรรณ',   email: 'saraban@psuwitsurat.ac.th', role: 'saraban' },

  // ── ฝ่ายการเงิน ──
  { name: 'เจ้าหน้าที่ฝ่ายการเงิน',  email: 'finance@psuwitsurat.ac.th', role: 'finance' },
];

// URL ฐานของระบบ
const SYSTEM_BASE_URL = 'https://entclick88.github.io/school-memo';

// ── สร้าง workflow อัตโนมัติตาม flow chart ของโรงเรียน ──
// docType : 'memo'=บันทึกข้อความ, 'external'=หนังสือภายนอก,
//           'order'=คำสั่ง, 'announce'=ประกาศ
// isFinance : เอกสารเกี่ยวข้องกับการเงิน (เฉพาะ memo)
// toDirector: true=เสนอ ผอ. / false=เสนอผู้ลงนามแทน (ผ่าน ผอ. ก่อน)
// headEmail : email หัวหน้าฝ่าย/กลุ่มสาระที่ดูแลเอกสารนี้
function buildWorkflow({ docType, isFinance, toDirector, headEmail }) {
  const find = role => STAFF_LIST.find(s => s.role === role);
  const head = (headEmail && STAFF_LIST.find(s => s.email === headEmail)) || find('head_dept');
  const finance    = find('finance');
  const saraban    = find('saraban');
  const director   = find('director');
  const authorized = find('authorized');

  const step = (staff, stepRole, label) => ({
    name: staff?.name || label,
    email: staff?.email || '',
    role: stepRole,
    label,
    status: 'pending',
  });

  const steps = [];

  if (docType === 'memo') {
    // บันทึกข้อความ (หนังสือภายใน)
    steps.push(step(head, 'head_sign', 'หัวหน้าฝ่าย/กลุ่มสาระ (ตรวจสอบ + ลงนามผ่าน)'));
    if (isFinance) {
      steps.push(step(finance, 'finance_check', 'เจ้าหน้าที่ฝ่ายการเงิน (ตรวจสอบ)'));
    }
    if (toDirector) {
      steps.push(step(director, 'signer', 'ผู้อำนวยการ (ลงนาม)'));
    } else {
      steps.push(step(director, 'head_sign', 'ผู้อำนวยการ (ลงนามผ่าน)'));
      steps.push(step(authorized, 'signer', 'ผู้ลงนามแทน (ลงนาม)'));
    }

  } else if (docType === 'external') {
    // หนังสือภายนอก
    steps.push(step(head, 'approver', 'หัวหน้าฝ่าย/กลุ่มสาระ (ตรวจสอบ)'));
    steps.push(step(saraban, 'saraban_check', 'งานสารบรรณ (ตรวจสอบ)'));
    if (toDirector) {
      steps.push(step(director, 'signer', 'ผู้อำนวยการ (ลงนาม)'));
    } else {
      steps.push(step(director, 'head_sign', 'ผู้อำนวยการ (ลงนามผ่าน)'));
      steps.push(step(authorized, 'signer', 'ผู้ลงนามแทน (ลงนาม)'));
    }
    steps.push(step(saraban, 'saraban_register', 'งานสารบรรณ (ออกเลข/จัดเก็บ)'));

  } else if (docType === 'order' || docType === 'announce') {
    // คำสั่ง / ประกาศ
    const typeLabel = docType === 'order' ? 'คำสั่ง' : 'ประกาศ';
    steps.push(step(head, 'head_sign', `หัวหน้าฝ่าย/กลุ่มสาระ (ลงนามผ่าน/ผู้ทาน ${typeLabel})`));
    steps.push(step(saraban, 'saraban_check', 'งานสารบรรณ (ตรวจสอบ)'));
    if (toDirector) {
      steps.push(step(director, 'signer', 'ผู้อำนวยการ (ลงนาม)'));
    } else {
      steps.push(step(director, 'head_sign', 'ผู้อำนวยการ (ลงนามผ่าน)'));
      steps.push(step(authorized, 'signer', 'ผู้ลงนามแทน (ลงนาม)'));
    }
    steps.push(step(saraban, 'saraban_register', 'งานสารบรรณ (ออกเลข/ประชาสัมพันธ์ School Connex)'));
  }

  return steps;
}

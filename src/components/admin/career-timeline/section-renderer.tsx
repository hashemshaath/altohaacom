import { GraduationCap, Briefcase, Trophy, Medal, Award, Users, Scale, Tv, CalendarCheck, FileText } from "lucide-react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { CareerRecord, SectionConfig } from "./constants";
import {
  EDUCATION_LEVELS, EMPLOYMENT_TYPES, MEMBERSHIP_TYPES, COMPETITION_ROLES, JUDGING_POSITIONS,
  formatDateShort, formatDateRange, labelFor, buildRecordMeta,
} from "./constants";
import { EmptyState, AddButton, CompactRow, SortableItem } from "./shared-ui";
import { CareerForm, MembershipForm, CompetitionAddForm, CompetitionEventForm, AwardAddForm } from "./career-forms";

// ── Props for the section content renderer ──
interface SectionContentProps {
  section: SectionConfig;
  isAr: boolean;
  isAddingHere: boolean;
  itemIds: string[];
  // Career records
  sectionRecords: CareerRecord[];
  careerForm: any;
  editingId: string | null;
  saveCareerPending: boolean;
  onUpdateCareer: (k: string, v: any) => void;
  onSaveCareer: () => void;
  onStartEditCareer: (r: CareerRecord) => void;
  onDeleteCareer: (id: string) => void;
  onStartAddCareer: (type: string) => void;
  onCloseForm: () => void;
  getMoveSections: (key: string) => { key: string; label: string }[];
  onMoveRecord: (id: string, target: string) => void;
  // Memberships
  memberships?: any[];
  membershipForm?: any;
  editingMembershipId?: string | null;
  saveMembershipPending?: boolean;
  onUpdateMembership?: (k: string, v: any) => void;
  onSaveMembership?: () => void;
  onStartAddMembership?: () => void;
  onStartEditMembership?: (m: any) => void;
  onDeleteMembership?: (id: string) => void;
  // Competitions (linked)
  competitions?: any[];
  availableCompetitions?: any[];
  selectedCompetitionId?: string;
  onSelectCompetition?: (id: string) => void;
  addCompetitionPending?: boolean;
  onSaveLinkCompetition?: () => void;
  addManualCompetitionPending?: boolean;
  onSaveManualCompetition?: () => void;
  competitionCareerRecords?: CareerRecord[];
  onDeleteCompetitionReg?: (id: string) => void;
  // Awards
  certificates?: any[];
  awardForm?: any;
  editingAwardId?: string | null;
  addAwardPending?: boolean;
  saveAwardPending?: boolean;
  onUpdateAward?: (k: string, v: any) => void;
  onSaveAward?: () => void;
  onAddAward?: () => void;
  onStartAddAward?: () => void;
  onStartEditAward?: (cert: any) => void;
  onDeleteAward?: (id: string) => void;
}

/** Renders the inner content of a career section (education, work, judging, etc.) */
export function SectionContent(props: SectionContentProps) {
  const { section, isAr } = props;
  const key = section.key;

  if (key === "memberships") return <MembershipsSectionContent {...props} />;
  if (key === "competitions") return <CompetitionsSectionContent {...props} />;
  if (key === "awards") return <AwardsSectionContent {...props} />;
  return <GenericCareerSectionContent {...props} />;
}

// ── Generic Career Section (education, work, judging, media, organizing, custom) ──
function GenericCareerSectionContent({
  section, isAr, isAddingHere, itemIds, sectionRecords, careerForm, editingId,
  saveCareerPending, onUpdateCareer, onSaveCareer, onStartEditCareer, onDeleteCareer,
  onStartAddCareer, onCloseForm, getMoveSections, onMoveRecord,
}: SectionContentProps) {
  const IconComp = getIconForSection(section.key);
  const emptyMsg = getEmptyMessage(section.key, isAr);
  const addLabel = getAddLabel(section.key, isAr);

  return (
    <>
      {sectionRecords.length === 0 && !isAddingHere && <EmptyState icon={IconComp} message={emptyMsg} />}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {sectionRecords.map(r => (
          <SortableItem key={r.id} id={r.id} sectionKey={section.key}>
            {editingId === r.id ? (
              <CareerForm form={careerForm} editingId={editingId} isAr={isAr}
                isPending={saveCareerPending}
                onUpdate={onUpdateCareer}
                onSave={onSaveCareer} onCancel={onCloseForm} />
            ) : (
              <RecordRow record={r} sectionKey={section.key} color={section.color} isAr={isAr}
                onEdit={() => onStartEditCareer(r)} onDelete={() => onDeleteCareer(r.id)}
                moveSections={getMoveSections(section.key)} onMove={(target) => onMoveRecord(r.id, target)} />
            )}
          </SortableItem>
        ))}
      </SortableContext>
      {isAddingHere && !editingId ? (
        <CareerForm form={careerForm} editingId={null} isAr={isAr}
          isPending={saveCareerPending}
          onUpdate={onUpdateCareer}
          onSave={onSaveCareer} onCancel={onCloseForm} />
      ) : !editingId || !isAddingHere ? (
        <AddButton label={addLabel} onClick={() => onStartAddCareer(section.key)} />
      ) : null}
    </>
  );
}

// ── Memberships Section ──
function MembershipsSectionContent({
  section, isAr, isAddingHere, memberships = [], membershipForm, editingMembershipId,
  saveMembershipPending = false, onUpdateMembership, onSaveMembership,
  onStartAddMembership, onStartEditMembership, onDeleteMembership, onCloseForm,
}: SectionContentProps) {
  return (
    <>
      {memberships.length === 0 && !isAddingHere && <EmptyState icon={Users} message={isAr ? "لا توجد عضويات" : "No memberships"} />}
      {memberships.map((m: any) => (
        editingMembershipId === m.id ? (
          <MembershipForm key={m.id} form={membershipForm} isAr={isAr} editingId={editingMembershipId} isPending={saveMembershipPending}
            onUpdate={onUpdateMembership!} onSave={onSaveMembership!} onCancel={onCloseForm} />
        ) : (
          <CompactRow key={m.id} icon={Users} color={section.color} logoUrl={m.culinary_entities?.logo_url}
            title={isAr ? (m.culinary_entities?.name_ar || m.culinary_entities?.name) : m.culinary_entities?.name}
            subtitle={[m.title && (isAr ? m.title_ar || m.title : m.title), m.membership_type && labelFor(m.membership_type, MEMBERSHIP_TYPES, isAr)].filter(Boolean).join(" · ")}
            meta={m.enrollment_date ? formatDateShort(m.enrollment_date, isAr) : formatDateShort(m.created_at, isAr)}
            badge={m.status === "active" ? (isAr ? "نشط" : "Active") : m.status} badgeVariant={m.status === "active" ? "default" : "secondary"}
            isAr={isAr} onEdit={() => onStartEditMembership?.(m)} onDelete={() => onDeleteMembership?.(m.id)} />
        )
      ))}
      {isAddingHere && !editingMembershipId ? (
        <MembershipForm form={membershipForm} isAr={isAr} isPending={saveMembershipPending}
          onUpdate={onUpdateMembership!} onSave={onSaveMembership!} onCancel={onCloseForm} />
      ) : !editingMembershipId ? <AddButton label={isAr ? "إضافة عضوية" : "Add Membership"} onClick={onStartAddMembership!} /> : null}
    </>
  );
}

// ── Competitions Section ──
function CompetitionsSectionContent({
  section, isAr, isAddingHere, competitions = [], competitionCareerRecords = [],
  availableCompetitions = [], selectedCompetitionId = "", onSelectCompetition,
  addCompetitionPending = false, onSaveLinkCompetition, addManualCompetitionPending = false,
  onSaveManualCompetition, careerForm, editingId, onUpdateCareer, onCloseForm,
  onStartEditCareer, onDeleteCareer, onDeleteCompetitionReg, onStartAddCareer,
  getMoveSections, onMoveRecord,
}: SectionContentProps) {
  return (
    <>
      {competitions.length === 0 && competitionCareerRecords.length === 0 && !isAddingHere &&
        <EmptyState icon={Trophy} message={isAr ? "لا توجد مشاركات أو فعاليات" : "No competitions or events"} />}
      {competitions.map((reg: any) => (
        <CompactRow key={reg.id} icon={Trophy} color={section.color}
          title={isAr ? (reg.competitions?.title_ar || reg.competitions?.title) : reg.competitions?.title} subtitle=""
          meta={`${reg.competitions?.competition_start ? formatDateShort(reg.competitions.competition_start, isAr) : ""}${reg.competitions?.country_code ? ` · ${reg.competitions.country_code}` : ""}`}
          badge={reg.status === "approved" ? (isAr ? "مقبول" : "Approved") : reg.status === "pending" ? (isAr ? "قيد المراجعة" : "Pending") : reg.status}
          badgeVariant={reg.status === "approved" ? "default" : "secondary"} isAr={isAr}
          onDelete={() => onDeleteCompetitionReg?.(reg.id)} />
      ))}
      {competitionCareerRecords.map(r => (
        editingId === r.id ? (
          <CompetitionEventForm key={r.id} form={careerForm} editingId={editingId} isAr={isAr} isPending={addManualCompetitionPending}
            onUpdate={onUpdateCareer} onSave={onSaveManualCompetition!} onCancel={onCloseForm} />
        ) : (
          <RecordRow key={r.id} record={r} sectionKey="competitions" color={section.color} isAr={isAr}
            onEdit={() => onStartEditCareer(r)} onDelete={() => onDeleteCareer(r.id)} />
        )
      ))}
      {isAddingHere && !editingId ? (
        <CompetitionAddForm competitions={availableCompetitions} selectedId={selectedCompetitionId} onSelect={onSelectCompetition!} isAr={isAr}
          isPendingLink={addCompetitionPending} onSaveLink={onSaveLinkCompetition!}
          careerForm={careerForm} onUpdateCareer={onUpdateCareer}
          isPendingManual={addManualCompetitionPending} onSaveManual={onSaveManualCompetition!} onCancel={onCloseForm} />
      ) : !editingId ? <AddButton label={isAr ? "إضافة مسابقة / فعالية" : "Add Competition / Event"} onClick={() => { onStartAddCareer("competitions"); }} /> : null}
    </>
  );
}

// ── Awards Section ──
function AwardsSectionContent({
  section, isAr, isAddingHere, certificates = [], awardForm, editingAwardId,
  addAwardPending = false, saveAwardPending = false, onUpdateAward,
  onSaveAward, onAddAward, onStartAddAward, onStartEditAward, onDeleteAward, onCloseForm,
}: SectionContentProps) {
  return (
    <>
      {certificates.length === 0 && !isAddingHere && <EmptyState icon={Medal} message={isAr ? "لا توجد جوائز" : "No awards"} />}
      {certificates.map((cert: any) => (
        editingAwardId === cert.id ? (
          <AwardAddForm key={cert.id} form={awardForm} isAr={isAr} editingId={editingAwardId} isPending={saveAwardPending}
            onUpdate={onUpdateAward!} onSave={onSaveAward!} onCancel={onCloseForm} />
        ) : (
          <CompactRow key={cert.id} icon={Award} color={section.color}
            title={isAr ? (cert.event_name_ar || cert.event_name) : cert.event_name}
            subtitle={isAr ? (cert.achievement_ar || cert.achievement || "") : (cert.achievement || "")}
            meta={`${cert.verification_code ? cert.verification_code.slice(-4) : ""}${cert.issued_at ? ` · ${formatDateShort(cert.issued_at, isAr)}` : ""}`}
            badge={cert.type} badgeVariant="outline" isAr={isAr} onEdit={() => onStartEditAward?.(cert)} onDelete={() => onDeleteAward?.(cert.id)} />
        )
      ))}
      {isAddingHere && !editingAwardId ? (
        <AwardAddForm form={awardForm} isAr={isAr} isPending={addAwardPending}
          onUpdate={onUpdateAward!} onSave={onAddAward!} onCancel={onCloseForm} />
      ) : !editingAwardId ? <AddButton label={isAr ? "إضافة جائزة" : "Add Award"} onClick={onStartAddAward!} /> : null}
    </>
  );
}

// ── Shared record row using buildRecordMeta ──
function RecordRow({ record, sectionKey, color, isAr, onEdit, onDelete, moveSections, onMove }: {
  record: CareerRecord; sectionKey: string; color: string; isAr: boolean;
  onEdit?: () => void; onDelete?: () => void;
  moveSections?: { key: string; label: string }[]; onMove?: (target: string) => void;
}) {
  const { mainTitle, subtitle, meta, badge, badgeVariant } = buildRecordMeta(record, sectionKey, isAr);
  const IconComp = getIconForSection(sectionKey);
  return (
    <CompactRow icon={IconComp} color={color}
      title={mainTitle} subtitle={subtitle} meta={meta}
      badge={badge} badgeVariant={badgeVariant}
      isCurrent={record.is_current} isAr={isAr}
      onEdit={onEdit} onDelete={onDelete}
      moveSections={moveSections} onMove={onMove}
      draggable />
  );
}

// ── Helpers ──
function getIconForSection(key: string) {
  const map: Record<string, any> = {
    education: GraduationCap, work: Briefcase, judging: Scale, media: Tv,
    organizing: CalendarCheck, competitions: Trophy, awards: Medal, memberships: Users,
  };
  return map[key] || FileText;
}

function getEmptyMessage(key: string, isAr: boolean): string {
  const msgs: Record<string, [string, string]> = {
    education: ["لا يوجد سجل تعليمي", "No education records"],
    work: ["لا يوجد سجل خبرات", "No work experience"],
    judging: ["لا يوجد سجل تحكيم", "No judging records"],
    media: ["لا توجد مقابلات تلفزيونية", "No television interviews"],
    organizing: ["لا يوجد سجل تنظيم", "No organizing records"],
  };
  const m = msgs[key];
  return m ? (isAr ? m[0] : m[1]) : (isAr ? "لا توجد عناصر" : "No items");
}

function getAddLabel(key: string, isAr: boolean): string {
  const labels: Record<string, [string, string]> = {
    education: ["إضافة تعليم", "Add Education"],
    work: ["إضافة خبرة", "Add Experience"],
    judging: ["إضافة تحكيم", "Add Judging"],
    media: ["إضافة مقابلة", "Add Interview"],
    organizing: ["إضافة فعالية منظمة", "Add Organized Event"],
  };
  const l = labels[key];
  return l ? (isAr ? l[0] : l[1]) : (isAr ? "إضافة عنصر" : "Add Item");
}

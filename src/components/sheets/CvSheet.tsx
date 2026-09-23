import type { SheetId } from '@/lib/pile';
import sheetStyles from '../Sheet.module.css';
import { CvEducation } from './CvEducation';
import { CvExperience } from './CvExperience';
import { CvFooter } from './CvFooter';
import { CvHeader } from './CvHeader';
import { CvProjects } from './CvProjects';
import { CvSkills } from './CvSkills';

type CvSheetProps = {
  onOpen: (id: SheetId) => void;
};

export function CvSheet({ onOpen }: CvSheetProps) {
  return (
    <div className={sheetStyles.wrap}>
      <CvHeader />
      <CvEducation />
      <CvExperience onOpen={onOpen} />
      <CvProjects onOpen={onOpen} />
      <CvSkills />
      <CvFooter onOpen={onOpen} />
    </div>
  );
}

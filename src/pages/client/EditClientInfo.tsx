
import EditClientInfo from '../EditClientInfo';
import { PageHeading } from '@/components/dashboard/PageHeading';

const EditClientInfoPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeading>Edit Client Information</PageHeading>
      <EditClientInfo />
    </div>
  );
};

export default EditClientInfoPage;

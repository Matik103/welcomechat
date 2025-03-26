
// Just updating the metadata handling on line 151
const handleSubmit = async (data: any) => {
  try {
    await clientMutation.mutateAsync(data);
    
    if (clientId) {
      await createClientActivity(
        clientId,
        'client_updated' as ActivityType,
        `Updated client information`,
        { fields_updated: Object.keys(data) }
      );
    }
    
    toast.success("Client information updated successfully");
    refetchClient();
  } catch (error) {
    console.error("Error updating client:", error);
    toast.error("Failed to update client information");
  }
};

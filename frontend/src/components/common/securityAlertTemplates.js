export const getSecurityAlertTemplate = (alertType, fileDetails = {}) => {
  const { fileName, expiresAt } = fileDetails;

  switch (alertType) {
    case "downloaded":
      return {
        message: `${fileName || "File"} was downloaded successfully.`,
        type: "success",
      };

    case "revoked":
      return {
        message: `The sharing link for ${fileName || "file"} has been revoked.`,
        type: "warn",
      };

    case "expiring":
      return {
        message: `${fileName || "File"} sharing link is expiring soon${
          expiresAt ? ` on ${expiresAt}` : ""
        }.`,
        type: "warn",
      };

    default:
      return {
        message: "A security-related event occurred.",
        type: "info",
      };
  }
};

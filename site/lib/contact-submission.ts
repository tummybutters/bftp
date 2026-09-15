import {
  INTAKE_VARIANT,
  addressIsComplete,
  emptyAddress,
  serviceOptions,
  propertyOptions,
  timingOptions,
} from "./contact-intake";
import {
  formatFileSize,
  UPLOAD_BUDGET_BYTES as MAX_UPLOAD_BYTES,
} from "./contact-uploads";

export interface ContactSubmission {
  intakeVariant: string;
  serviceAddress: string;
  addressStreet: string;
  addressUnit: string;
  addressState: string;
  addressPostalCode: string;
  addressSource: string;
  addressPlaceId: string;
  preferredDate: string;
  contactPreference: string;
  submissionId: string;
  submittedAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  propertyType: string;
  county: string;
  urgency: string;
  deviceCount: string;
  testingCount: string;
  deviceDetails: string[];
  sizeMakeModel: string;
  serviceDetails: string;
  uploadFiles: UploadedFileSummary[];
  notes: string;
  message: string;
  pagePath: string;
  sourceUrl: string;
  leadTopic: string;
  leadSource: string;
  city: string;
  referrer: string;
  userAgent: string;
}

interface UploadedFileSummary {
  name: string;
  size: number;
  type: string;
}

function readField(formData: FormData, names: string[]) {
  for (const name of names) {
    const value = formData.get(name);

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function readUploadedFiles(formData: FormData): UploadedFileSummary[] {
  return formData
    .getAll("contact_uploads")
    .filter((value): value is File => value instanceof File && value.size > 0)
    .map((file) => ({
      name: file.name || "upload",
      size: file.size,
      type: file.type || "application/octet-stream",
    }));
}

function readDeviceDetails(formData: FormData) {
  return formData
    .getAll("size_make_model_device")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function formatDeviceDetails(deviceDetails: string[]) {
  return deviceDetails
    .map((device, index) =>
      deviceDetails.length > 1 ? `Device ${index + 1}: ${device}` : device,
    )
    .join("\n");
}

function buildStructuredMessage(submission: ContactSubmission) {
  const lines = [
    `Service Type: ${submission.leadTopic || "Not provided"}`,
    `Preferred Contact: ${submission.contactPreference || "Not specified"}`,
    `Property Type: ${submission.propertyType || "Not provided"}`,
    ...(submission.addressStreet
      ? [`Service Address: ${submission.serviceAddress}`]
      : []),
    ...(submission.addressUnit
      ? [`Suite / Location: ${submission.addressUnit}`]
      : []),
    ...(submission.addressStreet
      ? [
          `Address Source: ${submission.addressSource} (customer supplied; not independently verified)`,
        ]
      : []),
    ...(submission.preferredDate
      ? [`Preferred Date (not booked): ${submission.preferredDate}`]
      : []),
    `County: ${submission.county || "Not provided"}`,
    `Urgency: ${submission.urgency || "Not provided"}`,
  ];

  if (submission.companyName) {
    lines.push(`Company Name: ${submission.companyName}`);
  }

  if (submission.testingCount) {
    lines.push(`# of Backflow Tests Needed: ${submission.testingCount}`);
  }

  if (submission.sizeMakeModel) {
    lines.push(`Size, Make, Model: ${submission.sizeMakeModel}`);
  }

  if (submission.serviceDetails) {
    lines.push(`Brief Description: ${submission.serviceDetails}`);
  }

  if (submission.deviceCount) {
    lines.push(`Device Count: ${submission.deviceCount}`);
  }

  if (submission.uploadFiles.length > 0) {
    lines.push(
      `Uploaded Files: ${submission.uploadFiles
        .map((file) => `${file.name} (${Math.round(file.size / 1024)} KB)`)
        .join(", ")}`,
    );
  }

  if (submission.city) {
    lines.push(`City: ${submission.city}`);
  }

  if (submission.notes) {
    lines.push("", "Additional Details:", submission.notes);
  }

  return lines.join("\n");
}

export function normalizeSubmission(
  formData: FormData,
  request: Request,
): ContactSubmission {
  const headers = request.headers;
  const deviceDetails = readDeviceDetails(formData);
  const sizeMakeModel =
    formatDeviceDetails(deviceDetails) ||
    readField(formData, ["size_make_model", "sizeMakeModel"]);
  const submission: ContactSubmission = {
    intakeVariant: readField(formData, ["intake_variant"]),
    serviceAddress: "",
    addressStreet: readField(formData, ["address_street"]),
    addressUnit: readField(formData, ["address_unit"]),
    addressState: readField(formData, ["address_state"]),
    addressPostalCode: readField(formData, ["address_postal_code"]),
    addressSource: ["places", "mapbox"].includes(
      readField(formData, ["address_source"]),
    )
      ? readField(formData, ["address_source"])
      : "manual",
    addressPlaceId: readField(formData, ["address_place_id"]),
    contactPreference: readField(formData, ["contact_preference"]),
    preferredDate: readField(formData, ["preferred_date"]),
    submissionId: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    firstName: readField(formData, ["first-name-2", "first_name", "firstName"]),
    lastName: readField(formData, ["last-name-2", "last_name", "lastName"]),
    email: readField(formData, ["email-field-2", "email", "emailAddress"]),
    phone: readField(formData, ["phone", "phone_number", "phoneNumber"]),
    companyName: readField(formData, [
      "company_name",
      "companyName",
      "company",
    ]),
    propertyType: readField(formData, ["property_type", "propertyType"]),
    county: readField(formData, ["county", "service_county", "serviceCounty"]),
    urgency: readField(formData, ["urgency", "timeline"]),
    deviceCount: readField(formData, ["device_count", "deviceCount"]),
    testingCount: readField(formData, ["testing_count", "testingCount"]),
    deviceDetails,
    sizeMakeModel,
    serviceDetails: readField(formData, ["service_details", "serviceDetails"]),
    uploadFiles: readUploadedFiles(formData),
    notes: readField(formData, ["Message-Field-4", "message", "details"]),
    message: "",
    pagePath: readField(formData, ["page_path", "pagePath", "source_path"]),
    sourceUrl: readField(formData, ["source_url", "sourceUrl"]),
    leadTopic: readField(formData, [
      "service_type",
      "lead_topic",
      "topic",
      "service",
      "subject",
    ]),
    leadSource:
      readField(formData, ["lead_source", "leadSource"]) ||
      "Website Contact Form",
    city: readField(formData, [
      "address_city",
      "city",
      "service_city",
      "serviceCity",
    ]),
    referrer: headers.get("referer") || "",
    userAgent: headers.get("user-agent") || "",
  };

  submission.serviceAddress = [
    submission.addressStreet,
    submission.city,
    [submission.addressState, submission.addressPostalCode]
      .filter(Boolean)
      .join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  submission.message = buildStructuredMessage(submission);

  return submission;
}

export function validateSubmission(submission: ContactSubmission) {
  const addressFirst = submission.intakeVariant === INTAKE_VARIANT;
  if (
    addressFirst &&
    !addressIsComplete({
      ...emptyAddress,
      street: submission.addressStreet,
      city: submission.city,
      state: submission.addressState,
      postalCode: submission.addressPostalCode,
    })
  ) {
    return "Please add your street address, city, state and ZIP code.";
  }
  if (
    addressFirst &&
    (!serviceOptions.some(([v]) => v === submission.leadTopic) ||
      !propertyOptions.some(([v]) => v === submission.propertyType) ||
      !timingOptions.some(([v]) => v === submission.urgency))
  ) {
    return "Please choose your service, property type and timing.";
  }
  if (
    addressFirst &&
    submission.contactPreference &&
    !["call", "email"].includes(submission.contactPreference)
  )
    return "Please choose how we should contact you.";
  if (
    addressFirst &&
    submission.testingCount &&
    submission.testingCount !== "Not Sure" &&
    (!/^\d+$/.test(submission.testingCount) ||
      Number(submission.testingCount) < 1 ||
      Number(submission.testingCount) > 100)
  )
    return "Please enter a device count from 1 to 100, or choose Not sure.";
  if (
    submission.preferredDate &&
    !/^\d{4}-\d{2}-\d{2}$/.test(submission.preferredDate)
  )
    return "Please check your preferred date.";
  if (
    !submission.firstName ||
    (!addressFirst && !submission.lastName) ||
    !submission.email ||
    !submission.phone ||
    !submission.leadTopic ||
    !submission.propertyType ||
    (!addressFirst && !submission.county) ||
    !submission.urgency
  ) {
    return "Please complete all required fields.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
    return "Please enter a valid email address.";
  }

  if (submission.phone.replace(/\D/g, "").length !== 10) {
    return "Please enter a 10-digit phone number.";
  }

  if (
    !addressFirst &&
    submission.leadTopic === "Testing" &&
    !submission.testingCount
  ) {
    return "Please enter the number of backflow tests needed or choose Not Sure.";
  }

  if (
    !addressFirst &&
    submission.leadTopic === "Repair / Replacement" &&
    (!submission.sizeMakeModel || !submission.serviceDetails)
  ) {
    return "Please add the size/make/model and a brief description.";
  }

  if (
    !addressFirst &&
    submission.leadTopic === "New Installation" &&
    !submission.serviceDetails
  ) {
    return "Please add a brief description.";
  }

  const uploadBytes = submission.uploadFiles.reduce(
    (total, file) => total + file.size,
    0,
  );

  if (uploadBytes > MAX_UPLOAD_BYTES) {
    return `Please keep uploads under ${formatFileSize(MAX_UPLOAD_BYTES)} total.`;
  }

  return null;
}

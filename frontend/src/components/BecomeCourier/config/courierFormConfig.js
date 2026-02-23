export const STEP_1_FIELDS = {
  fullName: {
    name: "fullName",
    label: "Full Name",
    placeholder: "John Doe",
    type: "text",
  },
  email: {
    name: "email",
    label: "Email Address",
    placeholder: "john@example.com",
    type: "email",
  },
  phoneNumber: {
    name: "phoneNumber",
    label: "Phone Number",
    placeholder: "9876543210",
    type: "tel",
  },
};

export const STEP_2_FIELDS = {
  vehicleType: {
    name: "vehicleType",
    label: "Vehicle Type",
    type: "select",
    options: [
      { value: "bike", label: "Bike" },
      { value: "scooter", label: "Scooter / Moped" },
      { value: "motorcycle", label: "Motorcycle" },
      { value: "car", label: "Car" },
    ],
  },
  vehicleNumber: {
    name: "vehicleNumber",
    label: "Vehicle Number",
    placeholder: "DL01AB1234",
    type: "text",
  },
  vehicleModel: {
    name: "vehicleModel",
    label: "Vehicle Model",
    placeholder: "Honda CB 150",
    type: "text",
  },
};

export const STEP_3_DOCUMENTS = {
  driverLicense: {
    title: "Driver License",
    fields: {
      number: {
        label: "License Number",
        placeholder: "DL12345",
        type: "text",
      },
      expiryDate: {
        label: "Expiry Date",
        type: "date",
      },
    },
  },
  vehicleRegistration: {
    title: "Vehicle Registration",
    fields: {
      number: {
        label: "Registration Number",
        placeholder: "DL01AB1234",
        type: "text",
      },
      expiryDate: {
        label: "Expiry Date",
        type: "date",
      },
    },
  },
  insurance: {
    title: "Insurance",
    fields: {
      number: {
        label: "Insurance Number",
        placeholder: "INS123456",
        type: "text",
      },
      expiryDate: {
        label: "Expiry Date",
        type: "date",
      },
    },
  },
};

export const PAYMENT_METHOD = {
  name: "paymentMethod",
  label: "Payment Method",
  subLabel: "Cash on Delivery (COD) - Get paid after each delivery",
  type: "radio",
  value: "cash",
};

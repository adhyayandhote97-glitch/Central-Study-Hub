import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0088b0",
          borderRadius: 7,
          color: "#f3f2f2",
          fontSize: 18,
          fontWeight: 700,
          fontFamily: "serif",
          letterSpacing: -0.5,
        }}
      >
        CS
      </div>
    ),
    { ...size }
  );
}

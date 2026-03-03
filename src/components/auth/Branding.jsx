import React from "react";

export default function Branding({ text, paragraph }) {
  return (
    <div className="w-full lg:w-1/2 bg-primary flex flex-col items-center justify-center text-white px-8 lg:px-12 py-12 lg:py-0">
      <img src="images/logo.png" alt="راي" className="w-3/4 lg:w-4/6 mb-6 max-w-xs" />
      <h3 className="text-2xl lg:text-4xl font-semibold mb-2 text-center">
        {text}
      </h3>
      <p className="text-center text-base lg:text-lg max-w-md">
        {paragraph}
      </p>
    </div>
  );
}

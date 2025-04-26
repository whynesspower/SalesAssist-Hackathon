"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signIn } from "next-auth/react";
import { Car, Link } from "lucide-react";

// Reusable Questionnaire Component
function Questionnaire({
  questions,
  handleSubmission,
}: {
  questions: string[];
  handleSubmission: (answers: boolean[]) => Promise<void>;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>(
    new Array(questions.length).fill(false)
  );
  const [isCompleted, setIsCompleted] = useState(false);
  const [licenseResult, setLicenseResult] = useState<any | null>(null);
  // const [licenseResult, setLicenseResult] = useState<any[] | null>(null);

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1); // Move to the next question
    } else {
      const results = await handleSubmission(answers);
      console.log("final answers which are set are", results);
      setLicenseResult(results);
      setIsCompleted(true);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleChange = (value: boolean) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = value;
    setAnswers(newAnswers);
  };

  const handleRestart = () => {
    setAnswers(new Array(questions.length).fill(false));
    setCurrentQuestionIndex(0);
    setLicenseResult(null);
    setIsCompleted(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isCompleted ? "Results" : "License War ⚔️💪"}</CardTitle>
      </CardHeader>

      {/* Display the questions or the result */}
      <CardContent className="space-y-4">
        {isCompleted ? (
          <div>
            <h3 className="text-lg font-medium">Suggested Licenses:</h3>
            <div className="mt-2">
              {licenseResult && licenseResult.length > 0 ? (
                licenseResult.map((result: any) => (
                  <Card key={result.license} className="m-2 p-2">
                    <CardContent>
                      <CardTitle>
                        <a
                          href={result.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex justify-center text-center items-center"
                        >
                          {result.license}
                          <Link className="ml-2" size={16} />
                        </a>
                      </CardTitle>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p>No licenses found based on your answers.</p>
              )}
            </div>
            <Button onClick={handleRestart} className="mt-4">
              Restart Questionnaire
            </Button>
          </div>
        ) : (
          <div className="space-y-1 text-2xl font-medium">
            <Label className="text-lg font-medium">
              {questions[currentQuestionIndex]}
            </Label>
            <div className="flex justify-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`question-${currentQuestionIndex}`}
                  onChange={() => handleChange(true)}
                  className="w-6 h-6 m-2"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`question-${currentQuestionIndex}`}
                  onChange={() => handleChange(false)}
                  className="w-6 h-6 m-2"
                />
                <span>No</span>
              </label>
            </div>
          </div>
        )}
      </CardContent>

      {/* Back, next and other buttons here */}
      <CardFooter className="flex justify-center space-x-4">
        <Button
          onClick={handleBack}
          disabled={currentQuestionIndex === 0 || isCompleted}
        >
          Back
        </Button>
        <Button disabled={isCompleted} onClick={handleNext}>
          {isCompleted || currentQuestionIndex == questions.length - 1
            ? "Submit"
            : "Next"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function TabsDemo() {
  const [proSearchState, setProSearchState] = useState<
    "initial" | "loading" | "questions" | "unauthorized" | "forbidden"
  >("initial");

  const [standardSearchState, setStandardSearchState] = useState<
    "initial" | "loading" | "questions"
  >("loading");

  const [proQuestions, setProQuestions] = useState<string[]>([]);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [standardQuestions, setStandardQuestions] = useState<string[]>([]);

  useEffect(() => {
    handleStandardQuestionFetch();
  }, []);

  const handleProSubmission = async (answers: boolean[]) => {
    const response = await fetch("/api/pro-search/submission", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answers }),
    });
    const data = await response.json();
    return data.suggestions;
  };

  const handleStandardSubmission = async (answers: boolean[]) => {
    const response = await fetch("/api/standard-search/submission", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answers }),
    });
    const data = await response.json();
    console.log("data suggestions is ", data.suggestions);
    return data.suggestions; // Fix typo here
  };

  const handleProQuestionFetch = async () => {
    setProSearchState("loading");
    try {
      const response = await fetch("/api/pro-search/questions");
      if (response.status === 200) {
        const data = await response.json();
        setProQuestions(data.questions);
        setProSearchState("questions");
      } else if (response.status === 401) {
        setProSearchState("unauthorized");
      } else if (response.status === 403) {
        setProSearchState("forbidden");
      }
    } catch (error) {
      console.error("Error fetching pro questions:", error);
      setProSearchState("initial");
    }
  };

  const handleStandardQuestionFetch = async () => {
    setStandardSearchState("loading");
    try {
      const response = await fetch("/api/standard-search/questions");
      const data = await response.json();
      setStandardQuestions(data.questions);
      setStandardSearchState("questions");
    } catch (error) {
      console.error("Error fetching pro questions:", error);
      setStandardSearchState("initial");
    }
  };

  const handleCheckout = async () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank");
    } else {
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setCheckoutUrl(data.checkoutUrl);
      } catch (error) {
        console.error("Error fetching checkout URL:", error);
      }
    }
  };

  const renderProSearchContent = () => {
    switch (proSearchState) {
      case "initial":
        return (
          <Card className="h-[225px]">
            <CardHeader>
              <CardTitle></CardTitle>
            </CardHeader>

            {/* Display the questions or the result */}
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium"></h3>
                <div className="mt-2"></div>
              </div>
              <Button onClick={handleProQuestionFetch}>Start Pro Search</Button>
            </CardContent>

            {/* Back, next and other buttons here */}
            <CardFooter className="flex justify-center space-x-4"></CardFooter>
          </Card>
        );
      case "loading":
        return <p>Loading...</p>;
      case "questions":
        return (
          <Questionnaire
            questions={proQuestions}
            handleSubmission={handleProSubmission}
          />
        );
      case "unauthorized":
        return (
          <div>
            <p>Please sign in to access Pro Search.</p>
            <Button onClick={() => signIn(undefined, { callbackUrl: "/" })}>
              Sign In
            </Button>
          </div>
        );
      case "forbidden":
        return (
          <div>
            <p>You need to be a pro user to access this feature.</p>
            <Button onClick={handleCheckout}>
              {checkoutUrl ? "Take me to checkout" : "Upgrade to Pro"}
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderStandardSearchContent = () => {
    switch (standardSearchState) {
      case "initial":
        return <></>;
      case "loading":
        return <p>Loading...</p>;
      case "questions":
        return (
          <Questionnaire
            questions={standardQuestions}
            handleSubmission={handleStandardSubmission}
          />
        );
    }
  };
  return (
    <Tabs
      defaultValue="standard-search"
      onValueChange={(value) => {
        if (value === "pro-search") {
          setStandardSearchState("initial");
        } else {
          setStandardSearchState("questions");
        }
      }}
      className="p-4"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="standard-search">Standard Search</TabsTrigger>
        <TabsTrigger value="pro-search">Pro Search</TabsTrigger>
      </TabsList>

      <TabsContent value="standard-search" forceMount>
        {renderStandardSearchContent()}
      </TabsContent>

      <TabsContent value="pro-search">{renderProSearchContent()}</TabsContent>
    </Tabs>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CarFuelType, CarType, carTypes } from "@/constants/cars";
import { autoGenerateCar } from "@/lib/actions/ai-action";
import { addNewCar, generateImage } from "@/lib/actions/cars-action";
import { imageKitAuthenticator } from "@/lib/imagekit";
import {
  addCarSchema,
  AddCarSchema,
  generateImageSchema,
  GenerateImageSchema,
} from "@/lib/zod";
import { useImages } from "@/store/image-store";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Image,
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import { LucideWandSparkles, LucideX } from "lucide-react";
import NextImage from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";

export const GenerateImage = () => {
  const { addImage } = useImages();
  const [image, setImage] = useState<{ base64Data: string; name: string }>();
  const [uploadLoader, setUploadLoader] = useState(false);
  const [generatingLoader, setGeneratingLoader] = useState(false);
  const [progress, setProgress] = useState(0);

  const abortController = new AbortController();

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<GenerateImageSchema>({
    resolver: zodResolver(generateImageSchema),
    defaultValues: {
      description: "",
      name: "",
    },
  });
  const onSubmit = async ({ description, name }: GenerateImageSchema) => {
    const toastId = toast.loading("Generating Image...");
    try {
      setGeneratingLoader(true);
      if (!description || !name)
        throw new Error("Description and Name are required");

      // generate image

      const data = await generateImage(description, name);
      if (!data) throw new Error("Failed to generated image");

      setImage(data);

      toast.success("Image Generated Successfully", { id: toastId });
    } catch (error) {
      toast.error("Error Generating Image", { id: toastId });
      console.log(error);
    } finally {
      setGeneratingLoader(false);
    }
  };
  const handleUpload = async () => {
    if (!image) {
      return toast.error("No Image to Upload");
    }
    let authParams;
    setUploadLoader(true);
    try {
      authParams = await imageKitAuthenticator();
    } catch (error) {
      console.error("Error authenticating with Imagekit", error);
      setUploadLoader(false);
      return;
    }
    const { signature, expire, token, publicKey } = authParams;

    try {
      const uploadResponse = await upload({
        signature,
        expire,
        token,
        publicKey,
        file: image.base64Data,
        fileName: image.name,
        folder: "cars",
        onProgress: (event) => {
          setProgress((event.loaded / event.total) * 100);
        },
        abortSignal: abortController.signal,
      });

      if (!uploadResponse.filePath)
        return toast.error("Failed to upload image");
      addImage(uploadResponse.filePath);
      console.log(uploadResponse);
      toast.success("Image Uploaded Successfully");
    } catch (error) {
      if (error instanceof ImageKitAbortError) {
        console.error("Upload aborted:", error.reason);
      } else if (error instanceof ImageKitInvalidRequestError) {
        console.error("Invalid request:", error.message);
      } else if (error instanceof ImageKitUploadNetworkError) {
        console.error("Network error:", error.message);
      } else if (error instanceof ImageKitServerError) {
        console.error("Server error:", error.message);
      } else {
        // Handle any other errors that may occur.
        console.error("Upload error:", error);
      }
    } finally {
      setUploadLoader(false);
    }
  };
  return (
    <div>
      <h1 className="text-2xl font-bold">Generate Image</h1>
      <p className="text-muted-foreground">
        Use AI to generate an image of your dream car.
      </p>
      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="space-y-2 ">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the car you want to generate..."
            rows={6}
            required
            {...register("description")}
          />
          {errors?.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>
        <div className="space-y-2 ">
          <Label htmlFor="file-name">File Name</Label>
          <Input
            id="file-name"
            placeholder="Enter a name for the generated image..."
            required
            {...register("name")}
          />
          {errors?.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>
        <Button disabled={generatingLoader}>
          {generatingLoader ? "Generating..." : "Generate Image"}
        </Button>
      </form>
      {image && (
        <>
          <div className="mt-4">
            <h2 className="text-lg">Generated Image</h2>
            {generatingLoader ? (
              <Skeleton className="w-full h-96 flex items-center justify-center rounded-lg" />
            ) : (
              <>
                <NextImage
                  width={1000}
                  height={1000}
                  src={image.base64Data}
                  alt="Generated Car"
                  className="w-full h-[25rem] object-cover rounded-lg"
                />
              </>
            )}
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant={"outline"}
              onClick={() => setImage({ base64Data: "", name: "" })}
            >
              Cancel
            </Button>
            <Button disabled={uploadLoader} onClick={handleUpload}>
              {uploadLoader ? "Uploading..." : "Upload Image"}
            </Button>
          </div>
        </>
      )}
      {progress > 0 && (
        <div className="mt-4 w-full">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-1">
            Uploading... {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );
};

const STORAGE_KEY = "new-car-details";
export const AddCarForm = () => {
  const [isGenerateAILoading, setIsGenerateAILoading] = useState(false);
  const [submitHandlerLoading, setSubmitHandlerLoading] = useState(false);
  const { images, addImage, removeImage, clearImages } = useImages();
  const inputRef = useRef<HTMLInputElement>(null);
  const [color, setColor] = useState<string>("");
  const [colors, setColors] = useState<string[]>([]);
  const [feature, setFeature] = useState<string>("");
  const [features, setFeatures] = useState<string[]>([]);

  const {
    handleSubmit,
    register,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<AddCarSchema>({
    resolver: zodResolver(addCarSchema) as Resolver<AddCarSchema>,
    defaultValues: {
      name: "",
      brand: "",
      type: undefined,
      year: new Date().getFullYear(),
      mileage: 0,
      colors: [],
      price: 0,
      description: "",
      images: [],
      transmission: "AUTOMATIC",
      features: [],
      location: "",
      fuelType: undefined,
      engineCapacity: undefined,
      doors: undefined,
      seats: undefined,
      topSpeed: undefined,
      acceleration: undefined,
      horsepower: undefined,
      torque: undefined,
      length: undefined,
      width: undefined,
      height: undefined,
      weight: undefined,
      // Seller details
      sellerName: "",
      sellerImage: "",
      sellerPhone: "",
      sellerEmail: "",
      sellerAddress: "",
      sellerCity: "",
      sellerState: "",
      sellerZip: "",
      sellerCountry: "",
      sellerWebsite: "",
    },
  });

  const addColor = useCallback(() => {
    if (!color || color.trim() === "" || colors.includes(color)) return;
    const newColors = [...colors, color];
    setColors(newColors);
    setValue("colors", newColors);
    setColor("");
  }, [color, colors, setValue]);

  const removeColor = useCallback(
    (colorToRemove: string) => {
      const newColors = colors.filter((c) => c !== colorToRemove);
      setColors(newColors);
      setValue("colors", newColors);
    },
    [colors, setValue]
  );

  const addFeature = useCallback(() => {
    if (!feature || feature.trim() === "" || features.includes(feature)) return;
    const newFeatures = [...features, feature];
    setFeatures(newFeatures);
    setValue("features", newFeatures);
    setFeature("");
  }, [feature, features, setValue]);

  const removeFeature = useCallback(
    (featureToRemove: string) => {
      const newFeatures = features.filter((f) => f !== featureToRemove);
      setFeatures(newFeatures);
      setValue("features", newFeatures);
    },
    [features, setValue]
  );
  const resetState = useCallback(() => {
    clearImages();
    setColors([]);
    setFeatures([]);
    reset();
    localStorage.removeItem(STORAGE_KEY);
  }, [clearImages, reset]);
  const onSubmit = useCallback(
    async (data: AddCarSchema) => {
      const toastId = toast.loading("Adding new car listing...");
      try {
        setSubmitHandlerLoading(true);
        await addNewCar({ ...data, images });
        toast.success("Car listing added successfully", {
          id: toastId,
        });

        resetState();
      } catch (error) {
        if (error instanceof Error) toast.error(error.message, { id: toastId });
        else toast.error("Error adding car listing.", { id: toastId });
      } finally {
        setSubmitHandlerLoading(false);
      }
    },
    [setSubmitHandlerLoading, resetState]
  );

  const autoGenerateHandler = useCallback(async () => {
    try {
      if (!watch("name"))
        return toast.error("Please enter a car name to generate images");
      setIsGenerateAILoading(true);
      const result = await autoGenerateCar(watch("name"));
      if (!result) {
        toast.error("Failed to generate car details");
        return;
      }
      setColors(result.colors);
      setFeatures(result.features);
      // set generated data to form state
      Object.entries(result).forEach(([key, value]) => {
        if (key === "images") return;

        if (key === "sellerImage") {
          setValue("sellerImage", "/default-image.jpg");
          return;
        }
        setValue(key as keyof AddCarSchema, value as string);
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));

      toast.success("Car details generated successfully");
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error("Failed to generate car details");
    } finally {
      setIsGenerateAILoading(false);
    }
  }, [watch, setValue]);

  useEffect(() => {
    setValue("images", images);
  }, [images]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved) as AddCarSchema;

    setColors(parsed.colors || []);
    setFeatures(parsed.features || []);

    Object.entries(parsed).forEach(([key, value]) => {
      if (key === "images") return; // DON'T override images from Zustand
      setValue(key as keyof AddCarSchema, value as any);
    });
  }, []); // RUNS ONLY ON FIRST PAGE LOAD

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <p>Add New Car Listing</p>
          <button onClick={autoGenerateHandler} disabled={isGenerateAILoading}>
            {isGenerateAILoading ? (
              <LucideWandSparkles className=" animate-ping ease-out direction-alternate duration-300" />
            ) : (
              <LucideWandSparkles />
            )}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Car Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., BMW M4 Competition"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">
                    {errors.name.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g., BMW, Tesla, Porsche"
                  {...register("brand")}
                />
                {errors.brand && (
                  <p className="text-sm text-red-500">
                    {errors.brand.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Car Type</Label>
                <Select
                  onValueChange={(value) => setValue("type", value as CarType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select car type" />
                  </SelectTrigger>
                  <SelectContent>
                    {carTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500">
                    {errors.type.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="e.g., 2023"
                  {...register("year")}
                />
                {errors.year && (
                  <p className="text-sm text-red-500">
                    {errors.year.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage</Label>
                <Input
                  id="mileage"
                  type="number"
                  step={"any"}
                  placeholder="e.g., 1200"
                  {...register("mileage")}
                />
                {errors.mileage && (
                  <p className="text-sm text-red-500">
                    {errors.mileage.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g., 50000"
                  {...register("price")}
                />
                {errors.price && (
                  <p className="text-sm text-red-500">
                    {errors.price.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="transmission">Transmission</Label>
                <Select
                  onValueChange={(value) =>
                    setValue("transmission", value as "MANUAL" | "AUTOMATIC")
                  }
                  defaultValue={"AUTOMATIC"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transmission type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                  </SelectContent>
                </Select>
                {errors.transmission && (
                  <p className="text-sm text-red-500">
                    {errors.transmission.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select
                  onValueChange={(value) =>
                    setValue("fuelType", value as CarFuelType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GASOLINE">Gasoline</SelectItem>
                    <SelectItem value="DIESEL">Diesel</SelectItem>
                    <SelectItem value="ELECTRIC">Electric</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                {errors.fuelType && (
                  <p className="text-sm text-red-500">
                    {errors.fuelType.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Los Angeles, CA"
                  {...register("location")}
                />
                {errors.location && (
                  <p className="text-sm text-red-500">
                    {errors.location.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Colors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Colors</h3>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add a color..."
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <Button type="button" onClick={addColor}>
                Add
              </Button>
            </div>
            {errors.colors && (
              <p className="text-sm text-red-500">
                {errors.colors.message as string}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {colors.map((c, idx) => (
                <Badge key={idx} className="flex items-center gap-1">
                  {c}
                  <button
                    type="button"
                    onClick={() => removeColor(c)}
                    className="cursor-pointer"
                  >
                    <LucideX className="h-3 w-3 hover:text-red-500" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Features</h3>
            <div className="flex items-center gap-2">
              <Input
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
                placeholder="Add a feature..."
              />
              <Button onClick={addFeature} type="button">
                Add
              </Button>
            </div>
            {errors.features && (
              <p className="text-sm text-red-500">
                {errors.features.message as string}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {features.map((f, idx) => (
                <Badge key={idx} className="flex items-center gap-1">
                  {f}
                  <button
                    className="cursor-pointer"
                    type="button"
                    onClick={() => removeFeature(f)}
                  >
                    <LucideX className="h-3 w-3 cursor-pointer" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Car Specifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Car Specifications (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="engineCapacity">Engine Capacity (cc)</Label>
                <Input
                  id="engineCapacity"
                  type="number"
                  step={"any"}
                  placeholder="e.g., 2998"
                  {...register("engineCapacity")}
                />
                {errors.engineCapacity && (
                  <p className="text-sm text-red-500">
                    {errors.engineCapacity.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="horsepower">Horsepower</Label>
                <Input
                  id="horsepower"
                  type="number"
                  placeholder="e.g., 503"
                  {...register("horsepower")}
                />
                {errors.horsepower && (
                  <p className="text-sm text-red-500">
                    {errors.horsepower.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="torque">Torque (Nm)</Label>
                <Input
                  id="torque"
                  type="number"
                  placeholder="e.g., 650"
                  {...register("torque")}
                />
                {errors.torque && (
                  <p className="text-sm text-red-500">
                    {errors.torque.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="acceleration">0-60 mph (seconds)</Label>
                <Input
                  id="acceleration"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 3.2"
                  {...register("acceleration")}
                />
                {errors.acceleration && (
                  <p className="text-sm text-red-500">
                    {errors.acceleration.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="topSpeed">Top Speed (mph)</Label>
                <Input
                  id="topSpeed"
                  type="number"
                  placeholder="e.g., 155"
                  {...register("topSpeed")}
                />
                {errors.topSpeed && (
                  <p className="text-sm text-red-500">
                    {errors.topSpeed.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="doors">Doors</Label>
                <Input
                  id="doors"
                  type="number"
                  placeholder="e.g., 4"
                  {...register("doors")}
                />
                {errors.doors && (
                  <p className="text-sm text-red-500">
                    {errors.doors.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="seats">Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  placeholder="e.g., 5"
                  {...register("seats")}
                />
                {errors.seats && (
                  <p className="text-sm text-red-500">
                    {errors.seats.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="length">Length (mm)</Label>
                <Input
                  id="length"
                  type="number"
                  step={"any"}
                  placeholder="e.g., 4794"
                  {...register("length")}
                />
                {errors.length && (
                  <p className="text-sm text-red-500">
                    {errors.length.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="width">Width (mm)</Label>
                <Input
                  id="width"
                  type="number"
                  step={"any"}
                  placeholder="e.g., 1887"
                  {...register("width")}
                />
                {errors.width && (
                  <p className="text-sm text-red-500">
                    {errors.width.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height (mm)</Label>
                <Input
                  id="height"
                  type="number"
                  step={"any"}
                  placeholder="e.g., 1393"
                  {...register("height")}
                />
                {errors.height && (
                  <p className="text-sm text-red-500">
                    {errors.height.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step={"any"}
                  placeholder="e.g., 1800"
                  {...register("weight")}
                />
                {errors.weight && (
                  <p className="text-sm text-red-500">
                    {errors.weight.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Description</h3>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide a detailed description of the vehicle..."
                rows={6}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message as string}
                </p>
              )}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Images</h3>
            <div className="space-y-2">
              <Label htmlFor="mainImage">Image URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="mainImage"
                  placeholder="Enter the URL of the image (direct link image path)"
                  ref={inputRef}
                />
                <Button
                  type="button"
                  onClick={() => {
                    const input = inputRef.current;
                    if (!input) return;

                    const url = input.value.trim();
                    if (!url) {
                      toast.error("Please add image URL");
                      return;
                    }

                    // Update Zustand immediately
                    useImages.setState((state) => ({
                      images: [...state.images, url],
                    }));

                    // Update RHF with the NEW Zustand value
                    const newImages = useImages.getState().images;
                    setValue("images", newImages);

                    console.log("UPDATED IMAGES =", newImages);

                    input.value = "";
                    toast.success("Image added!");
                  }}
                >
                  Add
                </Button>
              </div>
              {errors.images && (
                <p className="text-sm text-red-500">
                  {errors.images.message as string}
                </p>
              )}
            </div>

            {images.length > 0 && (
              <Carousel>
                <CarouselContent>
                  {images.map((item, idx) => (
                    <CarouselItem key={idx} className="relative">
                      <Image
                        src={item}
                        width={1000}
                        height={500}
                        alt={`Image-${idx}`}
                        className="w-full h-96 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(item)}
                        className="bg-primary p-1 rounded-full text-secondary absolute top-2 right-2"
                      >
                        <LucideX className="w-5 h-5 " />
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )}
          </div>

          {/* Seller Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Seller Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sellerName">Seller Name</Label>
                <Input
                  id="sellerName"
                  placeholder="e.g., John Doe"
                  {...register("sellerName")}
                />
                {errors.sellerName && (
                  <p className="text-sm text-red-500">
                    {errors.sellerName.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerPhone">Phone</Label>
                <Input
                  id="sellerPhone"
                  placeholder="e.g., +1 (555) 123-4567"
                  {...register("sellerPhone")}
                />
                {errors.sellerPhone && (
                  <p className="text-sm text-red-500">
                    {errors.sellerPhone.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerEmail">Email</Label>
                <Input
                  id="sellerEmail"
                  type="email"
                  placeholder="e.g., john@example.com"
                  {...register("sellerEmail")}
                />
                {errors.sellerEmail && (
                  <p className="text-sm text-red-500">
                    {errors.sellerEmail.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerWebsite">Website</Label>
                <Input
                  id="sellerWebsite"
                  placeholder="e.g., https://example.com"
                  {...register("sellerWebsite")}
                />
                {errors.sellerWebsite && (
                  <p className="text-sm text-red-500">
                    {errors.sellerWebsite.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerImage">Profile Image URL</Label>
                <Input
                  id="sellerImage"
                  placeholder="e.g., https://example.com/profile.jpg"
                  {...register("sellerImage")}
                />
                {errors.sellerImage && (
                  <p className="text-sm text-red-500">
                    {errors.sellerImage.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerAddress">Address</Label>
                <Input
                  id="sellerAddress"
                  placeholder="e.g., 123 Main St"
                  {...register("sellerAddress")}
                />
                {errors.sellerAddress && (
                  <p className="text-sm text-red-500">
                    {errors.sellerAddress.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerCity">City</Label>
                <Input
                  id="sellerCity"
                  placeholder="e.g., Los Angeles"
                  {...register("sellerCity")}
                />
                {errors.sellerCity && (
                  <p className="text-sm text-red-500">
                    {errors.sellerCity.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerState">State</Label>
                <Input
                  id="sellerState"
                  placeholder="e.g., CA"
                  {...register("sellerState")}
                />
                {errors.sellerState && (
                  <p className="text-sm text-red-500">
                    {errors.sellerState.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerZip">Zip Code</Label>
                <Input
                  id="sellerZip"
                  placeholder="e.g., 90001"
                  {...register("sellerZip")}
                />
                {errors.sellerZip && (
                  <p className="text-sm text-red-500">
                    {errors.sellerZip.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerCountry">Country</Label>
                <Input
                  id="sellerCountry"
                  placeholder="e.g., USA"
                  {...register("sellerCountry")}
                />
                {errors.sellerCountry && (
                  <p className="text-sm text-red-500">
                    {errors.sellerCountry.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <Button type="submit" disabled={submitHandlerLoading}>
              Add Listing
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

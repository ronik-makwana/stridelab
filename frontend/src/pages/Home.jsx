import FeaturedCollectionsSection from "../components/Home/FeaturedCollectionsSection";
import HeroSection from "../components/Home/HeroSection";
import NewArrivals from "../components/Home/NewArrivals";
import TopRatedProducts from "../components/Home/TopRatedProducts";
import Testimonial from "../components/Home/Testimonial";

const Home = () => {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeaturedCollectionsSection />
      <TopRatedProducts />
      <NewArrivals />
      <Testimonial />
    </div>
  );
};

export default Home;

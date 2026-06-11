interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
}

const SearchBar = ({ query, onQueryChange }: SearchBarProps) => {

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(event.target.value);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}> {/* Prevent form submission */} 
      <input type="text" value={query} onChange={handleChange} placeholder="Search for a word..." />
    </form>
  );
};

export default SearchBar;

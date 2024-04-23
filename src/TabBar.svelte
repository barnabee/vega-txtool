<script lang="ts">
   export let tabs: {[key: string]: any} = []
   export let name: (t: any, id: string) => string = (t, id) => t['name'] || id
   export let selected: string | null
</script>

<ul class="tabs">
  {#each Object.entries(tabs) as [key, tabInfo]}
    <li class:selected={key===selected}>
      <label>
        <input 
          type="radio"
           name="selectedTab"
            value={key} 
            checked={key===selected} 
            bind:group={selected} />
        {name(tabInfo, key)}
      </label>
    </li>
 	{/each}
 	<slot />
 </ul>

<style>
   ul {
    display: block;
    padding: 0;
    list-style-type: none;
    color: #eeeeee;
  }
  li  {
    display: inline-block;
    &.selected {
      color: #ffc560;
      background-color: #282c34;
    }
  }
  label {
    padding: 0.75rem 1rem;
    display: inline-block;
    font-weight: bold;
  }
  input[type=radio] {
    display: none;
  }
</style>
